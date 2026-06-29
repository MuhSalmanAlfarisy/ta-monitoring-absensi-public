
import { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Mail, Lock, CheckCircle, AlertCircle, ArrowLeft, Eye, EyeOff, User, Camera, X, ZoomIn, ZoomOut } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

// Imports for Image Cropping
import Cropper from 'react-easy-crop';
import { getCroppedImg } from '../../lib/image';


import { CircularLoader } from '../ui/CircularLoader';
import { LoginLeftSection } from '../login/LoginLeftSection';

interface RegisterPageProps {
    isDark?: boolean;
}

export function RegisterPage({ isDark = false }: RegisterPageProps) {
    const { loginWithGoogle, registerWithEmail, updateUserProfile } = useAuth();
    const navigate = useNavigate();

    // UI States
    const [step, setStep] = useState<'check' | 'password'>('check');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [info, setInfo] = useState(''); // For whitelisted status message

    // Creating Account State
    const [isCreating, setIsCreating] = useState(false);

    // Form Data
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Profile Data State
    const [name, setName] = useState('');

    // Crop State
    const [imageSrc, setImageSrc] = useState<string | null>(null);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
    const [blobToUpload, setBlobToUpload] = useState<Blob | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);


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

    const checkEmail = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setInfo('');
        setLoading(true);

        try {
            const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/system/auth/check-registration`, {
                email
            });
            const { status } = response.data;

            if (status === 'genesis') {
                setInfo("Sistem belum memiliki pengguna. Anda akan menjadi King Admin pertama.");
            } else if (status === 'registered') {
                setError("Email ini sudah terdaftar. Silakan login.");
            } else if (status === 'whitelisted') {
                setInfo("Email terdaftar sebagai pengurus.");
                setStep('password');
            } else {
                setError("Email belum terdaftar sebagai pengurus masjid.");
            }

            await logActivity(email, 'CHECK_REGISTRATION', `Check status result: ${status}`);

        } catch (err: any) {
            console.error("Check failed", err);
            setError("Gagal memverifikasi email. Coba lagi.");
            await logActivity(email, 'CHECK_REGISTRATION_FAILED', `Check failed: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            const imageDataUrl = await readFile(file);
            setImageSrc(imageDataUrl as string);
            setZoom(1);
            setCrop({ x: 0, y: 0 });
        }
    };

    const readFile = (file: File) => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.addEventListener('load', () => resolve(reader.result), false);
            reader.readAsDataURL(file);
        });
    };

    const handleCropComplete = (croppedArea: any, croppedAreaPixels: any) => {
        console.log(croppedArea);
        setCroppedAreaPixels(croppedAreaPixels);
    };

    const generateUploadBlob = async () => {
        try {
            if (imageSrc && croppedAreaPixels) {
                const blob = await getCroppedImg(imageSrc, croppedAreaPixels);
                if (blob) {
                    setBlobToUpload(blob);
                    setPreviewUrl(URL.createObjectURL(blob));
                    setImageSrc(null); // Close modal
                }
            }
        } catch (e) {
            console.error(e);
            setError("Gagal memproses gambar.");
        }
    };

    const completeRegistration = async () => {
        // Get fresh token
        await import('firebase/auth').then(async ({ getAuth }) => {
            const auth = getAuth();
            if (auth.currentUser) {
                const token = await auth.currentUser.getIdToken();

                // 2. USER CREATION ENDPOINT (NEW)
                // This creates the user in Postgres with role='pengurus'
                const registerData = new FormData();
                registerData.append("token", token);
                registerData.append("name", name);

                await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/system/auth/register`, registerData);

                // 3. Upload Photo if exists
                let photoUrl = "";
                if (blobToUpload) {
                    const formData = new FormData();
                    formData.append("file", blobToUpload, "profile.jpg");
                    formData.append("token", token);

                    const uploadRes = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/profile/upload-photo`, formData, {
                        headers: { 'Content-Type': 'multipart/form-data' }
                    });
                    photoUrl = uploadRes.data.url;
                    if (photoUrl.startsWith('/')) {
                        photoUrl = `${import.meta.env.VITE_API_BASE_URL}${photoUrl}`;
                    }
                }

                // 4. Update Local Context (Frontend)
                await updateUserProfile(name, photoUrl || undefined);
            }
        });

        await logActivity(email, 'REGISTER_SUCCESS', 'User successfully registered');

        // If successful, navigate to login
        navigate('/login', { replace: true });
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsCreating(true);

        if (password !== confirmPassword) {
            setError("Password tidak sama.");
            setIsCreating(false);
            return;
        }

        if (password.length < 6) {
            setError("Password minimal 6 karakter.");
            setIsCreating(false);
            return;
        }

        if (!name.trim()) {
            setError("Nama lengkap harus diisi.");
            setIsCreating(false);
            return;
        }

        try {
            // 1. Register using the context method
            // We don't need the return value of registerWithEmail, we just need to know it succeeded.
            // Pass 'false' to skip verifyWhitelist (which causes alert/logout loop)
            await registerWithEmail(email, password, false);

            // 2. Complete Registration (Backend & Profile)
            await completeRegistration();

        } catch (err: any) {
            console.error("Registration failed", err);

            // Fix: Handle Phantom User (Email blocked but not in DB)
            if (err.code === 'auth/email-already-in-use') {
                try {
                    console.log("Email in use, attempting cleanup...");
                    // Call cleanup endpoint
                    await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/system/auth/cleanup-phantom`, {
                        email
                    });

                    // Retry registration once (create user again)
                    await registerWithEmail(email, password, false);

                    // If retry succeeds, COMPLETE the registration!
                    await completeRegistration();
                    return;

                } catch (cleanupErr) {
                    console.error("Retry registration failed", cleanupErr);
                    setError("Email sudah terdaftar. Silakan login.");
                }
            } else {
                setError(err.message || "Gagal membuat akun.");
            }
            await logActivity(email, 'REGISTER_FAILED', `Registration failed: ${err.message}`);
        } finally {
            setIsCreating(false);
        }
    };

    const handleGenesisLogin = async () => {
        // Special flow for Genesis
        try {
            await loginWithGoogle();
            navigate('/dashboard', { replace: true });
        } catch (err: any) {
            setError(err.message);
        }
    };

    return (
        <div className={`min-h-screen flex ${isDark ? 'bg-[#111827]' : 'bg-[#F5F5F5]'}`}>
            <CircularLoader isLoading={loading || isCreating} />

            {/* Sisi Kiri: Logo & Branding (Desktop Only) */}
            <div className="hidden lg:block lg:w-[42%]">
                <LoginLeftSection isDark={isDark} />
            </div>

            {/* Sisi Kanan: Form Register */}
            <div className="w-full lg:w-[58%] flex items-center justify-center p-4 lg:p-12 relative overflow-hidden">
                <div className="w-full max-w-lg animate-in fade-in slide-in-from-right duration-700">
                    <div className={`rounded-2xl shadow-lg p-8 md:p-10 ${isDark ? 'bg-[#1F2937] text-gray-100' : 'bg-white'}`}>
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
                                Registrasi Pengurus
                            </p>
                        </div>

                        {step === 'check' && (
                            <form onSubmit={checkEmail} className="space-y-4">
                                {info && (
                                    <div className="bg-blue-50 text-blue-700 p-3 rounded-lg text-sm flex gap-2 items-start">
                                        <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" />
                                        <span>{info}</span>
                                    </div>
                                )}

                                {error && (
                                    <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm flex gap-2 items-start">
                                        <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                                        <span>{error}</span>
                                    </div>
                                )}

                                {info.includes("Genesis") ? (
                                    <Button
                                        type="button"
                                        onClick={handleGenesisLogin}
                                        className="w-full bg-[#0C5E3C] hover:bg-[#0a4d30] text-white"
                                    >
                                        Login dengan Google (King Admin)
                                    </Button>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label>Email</Label>
                                            <div className="relative flex items-center w-full">
                                                <div className="absolute inset-y-0 left-0 w-11 flex items-center justify-center pointer-events-none">
                                                    <Mail className="w-5 h-5 text-gray-400" />
                                                </div>
                                                <Input
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
                                        <Button
                                            type="submit"
                                            className="w-full bg-[#0C5E3C] hover:bg-[#0a4d30] text-white"
                                            disabled={loading}
                                        >
                                            {loading ? "Memeriksa..." : "Cek Status"}
                                        </Button>
                                    </div>
                                )}
                            </form>
                        )}

                        {step === 'password' && (
                            <form onSubmit={handleRegister} className="space-y-4">
                                <div className={`p-3 rounded-lg text-sm flex gap-2 items-center mb-4 ${isDark ? 'bg-green-900/30 text-green-400' : 'bg-green-50 text-green-700'}`}>
                                    <CheckCircle className="w-4 h-4 shrink-0" />
                                    <span className="text-left">Email terdaftar sebagai pengurus. Silakan buat password.</span>
                                </div>

                                {error && (
                                    <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm flex gap-2 items-start">
                                        <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                                        <span>{error}</span>
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <Label>Nama Lengkap</Label>
                                    <div className="relative flex items-center w-full">
                                        <div className="absolute inset-y-0 left-0 w-11 flex items-center justify-center pointer-events-none">
                                            <User className="w-5 h-5 text-gray-400" />
                                        </div>
                                        <Input
                                            type="text"
                                            placeholder="Nama Lengkap Anda"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            className={`h-11 w-full ${isDark ? 'bg-[#374151] border-gray-600 text-gray-100 placeholder-gray-400 dark-autofill' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'}`}
                                            style={{ paddingLeft: '2.75rem' }}
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Photo Upload UI */}
                                <div className="space-y-2">
                                    <Label>Foto Profil (Opsional)</Label>
                                    <div className="flex items-center gap-4">
                                        <div className={`relative w-16 h-16 rounded-full border overflow-hidden flex items-center justify-center ${isDark ? 'bg-[#374151] border-gray-600' : 'bg-gray-100 border-gray-200'}`}>
                                            {previewUrl ? (
                                                <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                                            ) : (
                                                <User className={`w-8 h-8 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                                            )}
                                        </div>
                                        <label className={`cursor-pointer border px-4 py-2 rounded-md transition-colors text-sm font-medium flex items-center gap-2 ${isDark ? 'bg-[#374151] border-gray-600 text-gray-200 hover:bg-gray-600' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}`}>
                                            <Camera className="w-4 h-4" />
                                            Pilih Foto
                                            <input
                                                type="file"
                                                className="hidden"
                                                accept="image/*"
                                                onChange={onFileChange}
                                            />
                                        </label>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label>Password Baru</Label>
                                    <div className="relative flex items-center w-full">
                                        <div className="absolute inset-y-0 left-0 w-11 flex items-center justify-center pointer-events-none">
                                            <Lock className="w-5 h-5 text-gray-400" />
                                        </div>
                                        <Input
                                            type={showPassword ? "text" : "password"}
                                            placeholder="Minimal 6 karakter"
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
                                <div className="space-y-2">
                                    <Label>Konfirmasi Password</Label>
                                    <div className="relative flex items-center w-full">
                                        <div className="absolute inset-y-0 left-0 w-11 flex items-center justify-center pointer-events-none">
                                            <Lock className="w-5 h-5 text-gray-400" />
                                        </div>
                                        <Input
                                            type={showConfirmPassword ? "text" : "password"}
                                            placeholder="Ulangi password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            className={`h-11 w-full ${isDark ? 'bg-[#374151] border-gray-600 text-gray-100 placeholder-gray-400 dark-autofill' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'}`}
                                            style={{ paddingLeft: '2.75rem', paddingRight: '2.75rem' }}
                                            required
                                        />
                                        <div className="absolute inset-y-0 right-0 w-11 flex items-center justify-center">
                                            <button
                                                type="button"
                                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                className="text-gray-400 hover:text-gray-600 focus:outline-none flex items-center justify-center p-1 rounded-full aspect-square"
                                            >
                                                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <Button
                                    type="submit"
                                    className="w-full bg-[#0C5E3C] hover:bg-[#0a4d30] text-white"
                                    disabled={isCreating}
                                >
                                    {isCreating ? "Mendaftarkan..." : "Selesaikan Registrasi"}
                                </Button>
                            </form>
                        )}

                        {/* Crop Modal */}
                        {imageSrc && (
                            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
                                <div className={`rounded-lg w-full max-w-md overflow-hidden flex flex-col max-h-[90vh] ${isDark ? 'bg-[#1F2937] text-gray-100' : 'bg-white'}`}>
                                    <div className={`p-4 border-b flex justify-between items-center ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                                        <h3 className="font-semibold text-lg">Sesuaikan Foto</h3>
                                        <button
                                            onClick={() => setImageSrc(null)}
                                            className={`transition-colors ${isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'}`}
                                            type="button"
                                        >
                                            <X className="w-6 h-6" />
                                        </button>
                                    </div>
                                    <div className="relative flex-1 min-h-[300px] bg-black">
                                        <Cropper
                                            image={imageSrc}
                                            crop={crop}
                                            zoom={zoom}
                                            aspect={1}
                                            onCropChange={setCrop}
                                            onCropComplete={handleCropComplete}
                                            onZoomChange={setZoom}
                                            cropShape="round"
                                            showGrid={false}
                                        />
                                    </div>
                                    <div className={`p-4 space-y-4 border-t ${isDark ? 'bg-[#1F2937] border-gray-700' : 'bg-white border-gray-200'}`}>
                                        <div className="flex items-center gap-4">
                                            <ZoomOut className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                                            <input
                                                type="range"
                                                value={zoom}
                                                min={1}
                                                max={3}
                                                step={0.1}
                                                onChange={(e) => setZoom(Number(e.target.value))}
                                                className="flex-1 accent-[#0C5E3C]"
                                            />
                                            <ZoomIn className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                                        </div>
                                        <Button
                                            type="button"
                                            onClick={() => {
                                                generateUploadBlob();
                                            }}
                                            className="w-full bg-[#0C5E3C] hover:bg-[#0a4d30] text-white"
                                        >
                                            Simpan Foto
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="mt-6 text-center">
                            <button
                                onClick={() => navigate('/login', { replace: true })}
                                className={`text-sm flex items-center justify-center gap-1 mx-auto hover:underline ${isDark ? 'text-gray-400 hover:text-[#78C2A4]' : 'text-gray-500 hover:text-[#0C5E3C]'}`}
                            >
                                <ArrowLeft className="w-4 h-4" />
                                Kembali ke Login
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
