
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, onAuthStateChanged, signOut, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile, updatePassword, EmailAuthProvider, linkWithCredential } from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebaseConfig';
import axios from 'axios';
import { api } from '../lib/axios';
interface AuthContextType {
    user: User | null;
    role: string | null;
    loading: boolean;
    loginWithGoogle: () => Promise<string>;
    loginWithEmail: (email: string, password: string) => Promise<string>;
    registerWithEmail: (email: string, password: string, shouldVerify?: boolean) => Promise<string>;
    resetPassword: (email: string) => Promise<void>;
    updateUserProfile: (name: string, photoURL?: string) => Promise<void>;
    updateUserPassword: (password: string) => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function getCurrentAppPath(): string {
    const hash = window.location.hash || '';
    if (hash.startsWith('#/')) {
        return hash.slice(1).split('?')[0] || '/';
    }
    return window.location.pathname;
}

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [role, setRole] = useState<string | null>(localStorage.getItem('role'));
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setUser(currentUser);
            if (currentUser) {
                // If we have a user but no role in memory (e.g. reload), we might rely on localStorage
                // or ideally fetch it again to be safe. For now, localStorage is the cache.
            } else {
                setRole(null);
                localStorage.removeItem('role');
                localStorage.removeItem('token');
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const verifyWhitelist = async (token: string) => {
        try {
            console.log("Verify Whitelist Start", token.substring(0, 10));
            const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/system/auth/login-google`, {
                token
            });
            console.log("Login Google Response:", response.data);

            if (response.data.status === 'needs_registration') {
                // Fix: Return status instead of hard redirect so LoginPage can handle it
                if (getCurrentAppPath() === '/register') {
                    console.log("Needs registration, but already on register page. Allowing flow to continue.");
                    return response.data.status;
                }

                // Instead of alert and window.location.replace, just return the status
                // The LoginPage will catch this and handle the redirect
                return response.data.status;
            }

            const { role: userRole, status, name, photo_url, access_token } = response.data;
            console.log("Setting Role:", userRole);
            setRole(userRole);
            localStorage.setItem('role', userRole);
            if (access_token) {
                localStorage.setItem('token', access_token);
            } else {
                localStorage.setItem('token', token);
            }

            // Sync profile from backend (Priority: Backend > Google)
            if (name || photo_url) {
                if (auth.currentUser) {
                    try {
                        const newName = name || auth.currentUser?.displayName;
                        let newPhoto = photo_url || auth.currentUser?.photoURL;

                        // Fix: If backend returns relative path, prepend API URL
                        if (photo_url && photo_url.startsWith('/')) {
                            newPhoto = `${import.meta.env.VITE_API_BASE_URL}${photo_url}`;
                        }

                        await updateProfile(auth.currentUser!, {
                            displayName: newName,
                            photoURL: newPhoto
                        });
                        setUser({ ...auth.currentUser!, displayName: newName, photoURL: newPhoto });
                    } catch (profileErr) {
                        console.error("Error syncing profile:", profileErr);
                    }
                }
            }

            return status;
        } catch (error: any) {
            console.error("Whitelist check failed", error);
            const status = error?.response?.status;
            const backendMessage =
                error?.response?.data?.detail?.message ||
                error?.response?.data?.detail ||
                error?.response?.data?.message;

            if (status === 403 || status === 409) {
                await signOut(auth);
                if (status === 403) {
                    throw new Error("Email Anda belum terdaftar sebagai pengurus masjid. Silakan hubungi Admin (Salman) untuk mendapatkan akses.");
                }
                throw new Error(
                    backendMessage ||
                    "Akun terdeteksi tidak sinkron antara Firebase Auth dan database lokal."
                );
            }
            if (backendMessage) {
                throw new Error(backendMessage);
            }
            throw error;
        }
    }

    const loginWithGoogle = async () => {
        try {
            const result = await signInWithPopup(auth, googleProvider);
            const token = await result.user.getIdToken();
            return await verifyWhitelist(token);
        } catch (error: any) {
            throw error;
        }
    };

    const loginWithEmail = async (email: string, password: string) => {
        try {
            console.log("Signing in with email...");
            const result = await signInWithEmailAndPassword(auth, email, password);
            console.log("Sign in success, getting token...");
            const token = await result.user.getIdToken();
            console.log("Got token, verifying whitelist...");
            return await verifyWhitelist(token);
        } catch (error: any) {
            console.error("Login failed", error);
            throw error;
        }
    };

    const registerWithEmail = async (email: string, password: string, shouldVerify: boolean = true) => {
        try {
            const result = await createUserWithEmailAndPassword(auth, email, password);
            const token = await result.user.getIdToken();
            if (shouldVerify) {
                return await verifyWhitelist(token);
            }
            return "registration_started";
        } catch (error: any) {
            console.error("Registration failed", error);
            throw error;
        }
    };

    const resetPassword = async (email: string) => {
        try {
            const response = await axios.post(
                `${import.meta.env.VITE_API_BASE_URL}/api/system/auth/forgot-password`,
                { email }
            );
            if (!response.data?.success) {
                throw new Error(response.data?.message || "Gagal mengirim link reset password.");
            }
        } catch (error: any) {
            const backendMessage =
                error?.response?.data?.message ||
                error?.response?.data?.detail?.message ||
                error?.response?.data?.detail;
            throw new Error(backendMessage || "Gagal mengirim link reset password.");
        }
    }

    const updateUserProfile = async (name: string, photoURL?: string) => {
        if (!auth.currentUser) throw new Error("No user logged in");

        await updateProfile(auth.currentUser!, {
            displayName: name,
            photoURL: photoURL
        });
        // Force update local state
        setUser({ ...auth.currentUser!, displayName: name, photoURL: photoURL || null });
    };

    const updateUserPassword = async (password: string) => {
        if (!auth.currentUser) throw new Error("No user logged in");

        const user = auth.currentUser;

        // Mengecek apakah user sudah memiliki metode login dengan password (seperti akun pengurus)
        const hasPasswordProvider = user.providerData.some(
            (provider) => provider.providerId === 'password'
        );

        if (!hasPasswordProvider && user.email) {
            // Jika belum punya (contoh: admin yang baru pertama kali login hanya via Google),
            // kita harus "menggabungkan" metode login Email & Password ke akunnya.
            const credential = EmailAuthProvider.credential(user.email, password);
            await linkWithCredential(user, credential);
        } else {
            // Jika sudah punya (pengurus), kita hanya mengupdate password seperti biasa
            await updatePassword(user, password);
        }

        // Notify backend to update timestamp
        const token = await user.getIdToken();
        const params = new URLSearchParams();
        params.append('token', token);
        await api.post('/api/profile/password-changed', params, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });
    };

    const logout = async () => {
        await signOut(auth);
        setRole(null);
        localStorage.removeItem('role');
        localStorage.removeItem('token');
    };

    return (
        <AuthContext.Provider value={{ user, role, loading, loginWithGoogle, loginWithEmail, registerWithEmail, resetPassword, updateUserProfile, updateUserPassword, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
