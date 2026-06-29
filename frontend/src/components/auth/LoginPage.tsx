import { useState, useEffect } from 'react';
import { CircularLoader } from '../ui/CircularLoader';
import { LoginLeftSection } from '../login/LoginLeftSection';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Lock, Mail, Eye, EyeOff, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { consumeSessionMessage } from '../../lib/axios';

interface LoginPageProps {
    isDark?: boolean;
}

export function LoginPage({ isDark = false }: LoginPageProps) {
    const { loginWithGoogle, loginWithEmail, resetPassword } = useAuth();
    const navigate = useNavigate();
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const [countdown, setCountdown] = useState(5);
    const [showPassword, setShowPassword] = useState(false);
    const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
    const [forgotEmail, setForgotEmail] = useState('');
    const [forgotLoading, setForgotLoading] = useState(false);
    const [forgotError, setForgotError] = useState('');
    const [forgotSuccess, setForgotSuccess] = useState('');

    // Form States
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    // Countdown Timer Effect
    useEffect(() => {
        let interval: any;
        if (loading && countdown > 0) {
            interval = setInterval(() => {
                setCountdown((prev) => prev - 1);
            }, 1000);
        } else if (!loading) {
            setCountdown(5); // Reset countdown when not loading
        }
        return () => clearInterval(interval);
    }, [loading, countdown]);

    useEffect(() => {
        const message = consumeSessionMessage();
        if (message) {
            setError(message);
        }
    }, []);

    useEffect(() => {
        if (!isForgotModalOpen) return;

        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setIsForgotModalOpen(false);
            }
        };

        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [isForgotModalOpen]);

    const logActivity = async (userEmail: string, action: string, details: string) => {
        try {
            await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/system/log-activity`, {
                email: userEmail,
                action: action,
                details: details
            });
        } catch (error) {
            console.error("Failed to log activity", error);
        }
    };

    const handleEmailLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        console.log("Handle Email Login Start");
        setError('');
        setSuccess('');
        setLoading(true);

        try {
            // 1. Check Backend First
            console.log("Checking registration status...");
            try {
                const checkRes = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/system/auth/check-registration`, {
                    email: email
                });
                console.log("Check registration response:", checkRes.data);

                if (checkRes.data.status === 'unauthorized') {
                    await logActivity(email, 'LOGIN_FAILED', 'Email belum terdaftar (unauthorized)');
                    setError('Email belum terdaftar. Silakan hubungi admin.');
                    setLoading(false);
                    return;
                }
            } catch (backendErr) {
                console.error("Backend check failed", backendErr);
                // If backend check fails (e.g. network error), we might want to let Firebase try
                // or show a generic error. For now, let's proceed to Firebase to be safe, 
                // or strict fail? User wants "Not registered" specifically.
                // If backend is down, we can't verify whitelist anyway.
            }

            // 2. Proceed to Firebase Login
            await loginWithEmail(email, password);
            await logActivity(email, 'LOGIN_SUCCESS', 'User berhasil login via Email');
            navigate('/dashboard', { replace: true });
        } catch (err: any) {
            const message = err.message || '';
            console.error("Login Error:", err.code, message);

            await logActivity(email, 'LOGIN_FAILED', `Gagal login email: ${message}`);

            // Firebase error mapping
            if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
                setError('Email atau password salah.');
            } else if (err.code === 'auth/invalid-credential') {
                setError('Email atau password salah. Jika akun sebelumnya dipulihkan lewat Google, gunakan Login Google atau Lupa Password untuk set ulang password.');
            } else if (err.code === 'auth/operation-not-allowed') {
                setError('Akun tidak ditemukan atau metode login ini belum diaktifkan. Silakan hubungi Admin.');
            } else if (message.includes('401')) {
                setError('Maaf permintaan anda gagal');
            } else {
                setError(message || 'Terjadi kesalahan saat login. Silakan coba lagi.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setError('');
        setSuccess('');
        setLoading(true);
        setCountdown(10); // Start countdown (30s timeout)

        try {
            // Create a timeout promise that rejects after 30 seconds
            const timeoutPromise = new Promise((_, reject) => {
                const id = setTimeout(() => {
                    clearTimeout(id);
                    reject(new Error('Login timeout: Terlalu lama, silakan coba lagi.'));
                }, 30000);
            });

            // Fast-Track Cancellation: Deteksi kembalinya fokus ke window utama
            // Firebase SDK butuh ~1 detik untuk sadar popup ditutup. Kita buat lebih cepat.
            const handleFocusFastTrack = () => {
                // Beri sedikit nafas (100ms) agar jika login berhasil, state success yang menang
                setTimeout(() => {
                    if (document.hasFocus()) {
                        setLoading(false);
                        setCountdown(0);
                        setError('Login dibatalkan oleh user.');
                        window.removeEventListener('focus', handleFocusFastTrack);
                    }
                }, 100);
            };
            window.addEventListener('focus', handleFocusFastTrack);

            // Race between actual login and timeout
            const status = await Promise.race([
                loginWithGoogle(),
                timeoutPromise
            ]);

            // Jika sampai sini (sukses), hapus listener agar tidak ganggu
            window.removeEventListener('focus', handleFocusFastTrack);

            if (status === 'needs_registration') {
                await logActivity('google-user', 'LOGIN_NEED_REGISTRATION', 'User login Google but need manual registration for name/photo');
                // Auto redirect to register page, wait a tiny bit to avoid rapid switch without knowing
                setError('Silakan selesaikan registrasi manual untuk mengatur Nama & Foto.');
                setTimeout(() => {
                    navigate('/register', { replace: true });
                }, 2000);
            } else if (status === 'needs_completion') {
                await logActivity('google-user', 'LOGIN_GOOGLE_PARTIAL', 'User login Google but need completion');
                navigate('/register-completion', { replace: true });
            } else {
                await logActivity('google-user', 'LOGIN_SUCCESS', 'User berhasil login via Google');
                navigate('/dashboard', { replace: true });
            }

        } catch (err: any) {
            // LANGSUNG hentikan loading agar UI responsif
            setLoading(false);
            setCountdown(0);

            console.error("Google Login Error:", err);
            const message = err.message || '';
            const isCancelled = 
                err.code === 'auth/popup-closed-by-user' || 
                err.code === 'auth/cancelled-popup-request';

            // Tampilkan pesan error segera tanpa menunggu log backend
            if (err.code === 'auth/popup-closed-by-user') {
                setError('Login dibatalkan oleh user.');
            } else if (err.code === 'auth/cancelled-popup-request') {
                setError('Permintaan login dibatalkan.');
            } else if (message.includes('401')) {
                setError('Maaf permintaan anda gagal');
            } else if (message.includes('timeout')) {
                setError('Waktu login habis. Silakan coba lagi.');
            } else {
                setError(message || 'Gagal login dengan Google.');
            }

            // Hanya log kegemalan yang bukan pembatalan user
            if (!isCancelled) {
                await logActivity('google-user', 'LOGIN_FAILED', `Gagal login Google: ${message}`);
            }
        } finally {
            setLoading(false);
            setCountdown(0);
        }
    };

    const openForgotPasswordModal = () => {
        setForgotEmail(email || '');
        setForgotError('');
        setForgotSuccess('');
        setIsForgotModalOpen(true);
    };

    const closeForgotPasswordModal = () => {
        if (forgotLoading) return;
        setIsForgotModalOpen(false);
    };

    const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const normalizedEmail = forgotEmail.trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        setForgotError('');
        setForgotSuccess('');

        if (!emailRegex.test(normalizedEmail)) {
            setForgotError('Format email tidak valid.');
            return;
        }

        setForgotLoading(true);
        try {
            await resetPassword(normalizedEmail);
            setForgotSuccess('Link reset password telah dikirim ke email Anda.');
        } catch (err: any) {
            setForgotError(err?.message || 'Gagal mengirim link reset password. Silakan coba lagi.');
        } finally {
            setForgotLoading(false);
        }
    };

    return (
        <div className={`min-h-screen flex ${isDark ? 'bg-[#111827]' : 'bg-[#F5F5F5]'}`}>
            <CircularLoader isLoading={loading} />

            {/* Sisi Kiri: Logo & Branding (Desktop Only) */}
            <div className="hidden lg:block lg:w-[42%]">
                <LoginLeftSection isDark={isDark} />
            </div>

            {/* Sisi Kanan: Form Login */}
            <div className="w-full lg:w-[58%] flex items-center justify-center p-4 lg:p-12 relative overflow-hidden">
                <div className="w-full max-w-lg animate-in fade-in slide-in-from-right duration-700">
                    <div className={`rounded-2xl shadow-lg p-8 md:p-10 ${isDark ? 'bg-[#1F2937] text-gray-100' : 'bg-white'}`}>
                        {/* Logo and Header */}
                        <div className="text-center mb-8">
                            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-[#0C5E3C] to-[#78C2A4] rounded-2xl mb-4 shadow-lg shadow-[#0C5E3C]/20">
                                <i
                                    className="fas fa-mosque"
                                    style={{ fontSize: '36px', color: '#ffffff' }}
                                />
                            </div>
                            <h1 className={`text-2xl font-bold mb-2 ${isDark ? 'text-[#78C2A4]' : 'text-[#0C5E3C]'}`}>
                                Masjid Jami Nurut Taqwa
                            </h1>
                            <p className={`font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                Sistem Monitoring Absensi Jamaah
                            </p>
                        </div>

                        {/* Login Action */}
                        <div className="space-y-6">
                            {error && (
                                <div className={`px-4 py-3 rounded-lg text-sm border ${isDark ? 'bg-red-900/30 border-red-800 text-red-300' : 'bg-red-50 border-red-200 text-red-700'}`}>
                                    {error}
                                </div>
                            )}
                            {success && (
                                <div className={`px-4 py-3 rounded-lg text-sm border ${isDark ? 'bg-green-900/30 border-green-800 text-green-300' : 'bg-green-50 border-green-200 text-green-700'}`}>
                                    {success}
                                </div>
                            )}

                            <form onSubmit={handleEmailLogin} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <div className="relative flex items-center w-full">
                                        <div className="absolute inset-y-0 left-0 w-11 flex items-center justify-center pointer-events-none">
                                            <Mail className="w-5 h-5 text-gray-400" />
                                        </div>
                                        <Input
                                            id="email"
                                            type="email"
                                            placeholder="nama@email.com"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className={`h-11 w-full ${isDark ? 'bg-[#374151] border-gray-600 text-gray-100 placeholder-gray-400 dark-autofill' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'}`}
                                            style={{ paddingLeft: '2.75rem' }}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="password">Password</Label>
                                        <button
                                            type="button"
                                            onClick={openForgotPasswordModal}
                                            className={`text-xs hover:underline ${isDark ? 'text-[#78C2A4]' : 'text-[#0C5E3C]'}`}
                                            tabIndex={-1}
                                        >
                                            Lupa password?
                                        </button>
                                    </div>
                                    <div className="relative flex items-center w-full">
                                        <div className="absolute inset-y-0 left-0 w-11 flex items-center justify-center pointer-events-none">
                                            <Lock className="w-5 h-5 text-gray-400" />
                                        </div>
                                        <Input
                                            id="password"
                                            type={showPassword ? "text" : "password"}
                                            placeholder="••••••••"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className={`h-11 w-full ${isDark ? 'bg-[#374151] border-gray-600 text-gray-100 placeholder-gray-400 dark-autofill' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'}`}
                                            style={{ paddingLeft: '2.75rem', paddingRight: '2.75rem' }}
                                            required
                                        />
                                        <div className="absolute inset-y-0 right-0 w-11 flex items-center justify-center">
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="text-gray-400 hover:text-gray-600 focus:outline-none flex items-center justify-center p-1 rounded-full aspect-square"
                                            >
                                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <Button
                                    type="submit"
                                    className="w-full h-11 bg-[#0C5E3C] hover:bg-[#0a4d30] text-white transition-colors"
                                    disabled={loading}
                                >
                                    {loading ? 'Memproses...' : 'Masuk'}
                                </Button>
                            </form>

                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <span className={`w-full border-t ${isDark ? 'border-gray-600' : 'border-gray-200'}`} />
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className={`px-2 ${isDark ? 'bg-[#1F2937] text-gray-400' : 'bg-white text-gray-500'}`}>
                                        Atau masuk dengan
                                    </span>
                                </div>
                            </div>

                            <Button
                                type="button"
                                onClick={handleGoogleLogin}
                                className={`w-full h-11 flex items-center justify-center gap-3 border transition-all duration-200 hover:shadow-md ${isDark ? 'bg-[#374151] hover:bg-[#4B5563] text-gray-200 border-gray-600' : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-200'} ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                                disabled={loading}
                            >
                                {loading ? (
                                    <div className="flex items-center gap-2">
                                        <div className="w-5 h-5 border-2 border-gray-300 border-t-[#0C5E3C] rounded-full animate-spin" />
                                        <span className="text-sm">Menunggu... ({countdown}s)</span>
                                    </div>
                                ) : (
                                    <>
                                        <img
                                            src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                                            width="20"
                                            height="20"
                                            alt="Google"
                                        />
                                        <span className="font-medium">
                                            Google
                                        </span>
                                    </>
                                )}
                            </Button>

                            <div className="text-center text-sm">
                                <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>Belum punya akun? </span>
                                <button
                                    type="button"
                                    onClick={() => navigate('/register')}
                                    className={`font-medium hover:underline ${isDark ? 'text-[#78C2A4]' : 'text-[#0C5E3C]'}`}
                                >
                                    Daftar
                                </button>
                            </div>
                        </div>

                        <div className="mt-8 text-center">
                            <p className={`text-sm ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                                © 2026 Masjid Jami Nurut Taqwa
                            </p>
                        </div>
                    </div>

                    {/* Illustration (Desktop Hidden if redundant) */}
                    <div className="mt-8 text-center animate-in fade-in slide-in-from-bottom-4 duration-700 lg:hidden">
                        <div className={`inline-flex items-center gap-2 opacity-60 ${isDark ? 'text-[#78C2A4]' : 'text-[#0C5E3C]'}`}>
                            <div className="w-2 h-2 bg-[#D4AF37] rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                            <span className="text-sm font-medium tracking-wide">Sistem Monitoring Absensi Jamaah</span>
                            <div className="w-2 h-2 bg-[#78C2A4] rounded-full animate-bounce"></div>
                        </div>
                    </div>
                </div>
            </div>

            {isForgotModalOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
                    onClick={closeForgotPasswordModal}
                >
                    <div
                        className={`w-full max-w-md rounded-2xl p-6 shadow-xl ${isDark ? 'bg-[#1F2937] text-gray-100' : 'bg-white'}`}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-[#0C5E3C]">Reset Password</h2>
                            <button
                                type="button"
                                onClick={closeForgotPasswordModal}
                                className="rounded-md p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                                aria-label="Tutup modal reset password"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {forgotError && (
                            <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                                {forgotError}
                            </div>
                        )}
                        {forgotSuccess && (
                            <div className="mb-3 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
                                {forgotSuccess}
                            </div>
                        )}

                        <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="forgot-email">Email</Label>
                                <div className="relative flex items-center w-full">
                                    <div className="absolute inset-y-0 left-0 w-11 flex items-center justify-center pointer-events-none">
                                        <Mail className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <Input
                                        id="forgot-email"
                                        type="email"
                                        placeholder="nama@email.com"
                                        value={forgotEmail}
                                        onChange={(e) => setForgotEmail(e.target.value)}
                                        className={`h-11 w-full ${isDark ? 'bg-[#374151] border-gray-600 text-gray-100 placeholder-gray-400 dark-autofill' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'}`}
                                        style={{ paddingLeft: '2.75rem' }}
                                        autoFocus
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 pt-1">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={closeForgotPasswordModal}
                                    disabled={forgotLoading}
                                >
                                    Batal
                                </Button>
                                <Button
                                    type="submit"
                                    className="bg-[#0C5E3C] text-white hover:bg-[#0a4d30]"
                                    disabled={forgotLoading}
                                >
                                    {forgotLoading ? (
                                        <span className="flex items-center gap-2">
                                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/50 border-t-white" />
                                            Mengirim...
                                        </span>
                                    ) : (
                                        'Kirim Link Reset'
                                    )}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
