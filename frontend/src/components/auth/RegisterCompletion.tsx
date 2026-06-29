import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { colors, spacing, borderRadius } from '../../lib/theme';
import { Phone, Check, AlertCircle, Lock } from 'lucide-react';
interface RegisterCompletionProps {
    isDark?: boolean;
}

export function RegisterCompletion({ isDark = false }: RegisterCompletionProps) {
    const { user, updateUserPassword } = useAuth();
    const navigate = useNavigate();
    const [phoneNumber, setPhoneNumber] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Redirect if no user (should be protected by auth state in theory, but for safety)
    useEffect(() => {
        if (!user) {
            navigate('/login', { replace: true });
        }
    }, [user, navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!phoneNumber) {
            setError('Nomor WhatsApp wajib diisi');
            return;
        }
        if (password.length < 6) {
            setError('Password minimal 6 karakter');
            return;
        }
        if (password !== confirmPassword) {
            setError('Konfirmasi password tidak cocok');
            return;
        }

        setLoading(true);
        setError('');

        try {
            // 1. Link/update password using the shared auth helper so
            // Google-only accounts can also sign in with email/password later.
            if (user) {
                await updateUserPassword(password);
            }

            const token = await user?.getIdToken();

            // 2. Call backend to complete registration
            await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/system/auth/register-completion`, {
                token,
                phone_number: phoneNumber
            });

            // Update local storage role if returned, or just let the dashboard redirect handle it
            // For now, assume success means we can go to dashboard
            navigate('/dashboard', { replace: true });

        } catch (err: any) {
            console.error(err);
            setError(err.response?.data?.detail || err.message || 'Gagal menyimpan data. Coba lagi.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: isDark ? '#111827' : '#f9fafb',
            padding: spacing.md
        }}>
            <div style={{
                width: '100%',
                maxWidth: '450px',
                backgroundColor: isDark ? '#1F2937' : '#ffffff',
                borderRadius: borderRadius.xl,
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                padding: spacing.xl,
                color: isDark ? '#F3F4F6' : 'inherit'
            }}>
                <h2 style={{
                    fontSize: '1.25rem',
                    fontWeight: 600,
                    marginBottom: spacing.md,
                    color: isDark ? '#A7F3D0' : colors.primary.main
                }}>
                    Lengkapi Data Pendaftaran
                </h2>

                <p style={{
                    fontSize: '0.875rem',
                    color: isDark ? '#9CA3AF' : '#6B7280',
                    marginBottom: spacing.lg
                }}>
                    Silakan atur password dan nomor WhatsApp Anda untuk menyelesaikan proses registrasi.
                </p>

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: spacing.lg }}>
                        <label style={{
                            display: 'block',
                            fontSize: '0.875rem',
                            fontWeight: 500,
                            color: isDark ? '#D1D5DB' : '#374151',
                            marginBottom: spacing.xs
                        }}>
                            Email (dari Google)
                        </label>
                        <input
                            type="text"
                            value={user?.email || ''}
                            disabled
                            className={isDark ? 'dark-autofill' : ''}
                            style={{
                                width: '100%',
                                padding: spacing.md,
                                backgroundColor: isDark ? '#374151' : '#F3F4F6',
                                border: `1px solid ${isDark ? '#4B5563' : '#D1D5DB'}`,
                                borderRadius: borderRadius.md,
                                color: isDark ? '#9CA3AF' : '#6B7280',
                                cursor: 'not-allowed'
                            }}
                        />
                    </div>

                    <div style={{ marginBottom: spacing.lg }}>
                        <label style={{
                            display: 'block',
                            fontSize: '0.875rem',
                            fontWeight: 500,
                            color: isDark ? '#D1D5DB' : '#374151',
                            marginBottom: spacing.xs
                        }}>
                            Password Baru
                        </label>
                        <div style={{ position: 'relative' }}>
                            <Lock size={18} style={{
                                position: 'absolute',
                                left: spacing.md,
                                top: '50%',
                                transform: 'translateY(-50%)',
                                color: isDark ? '#9CA3AF' : '#9CA3AF'
                            }} />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Minimal 6 karakter"
                                required
                                className={isDark ? 'dark-autofill' : ''}
                                style={{
                                    width: '100%',
                                    padding: `${spacing.md} ${spacing.md} ${spacing.md} 40px`,
                                    borderRadius: borderRadius.md,
                                    border: `1px solid ${isDark ? '#4B5563' : '#D1D5DB'}`,
                                    backgroundColor: isDark ? '#374151' : '#ffffff',
                                    color: isDark ? '#F3F4F6' : 'inherit',
                                    outline: 'none',
                                    transition: 'border-color 0.2s'
                                }}
                                onFocus={(e) => e.target.style.borderColor = isDark ? '#A7F3D0' : colors.primary.main}
                                onBlur={(e) => e.target.style.borderColor = isDark ? '#4B5563' : '#D1D5DB'}
                            />
                        </div>
                    </div>

                    <div style={{ marginBottom: spacing.lg }}>
                        <label style={{
                            display: 'block',
                            fontSize: '0.875rem',
                            fontWeight: 500,
                            color: isDark ? '#D1D5DB' : '#374151',
                            marginBottom: spacing.xs
                        }}>
                            Konfirmasi Password
                        </label>
                        <div style={{ position: 'relative' }}>
                            <Lock size={18} style={{
                                position: 'absolute',
                                left: spacing.md,
                                top: '50%',
                                transform: 'translateY(-50%)',
                                color: isDark ? '#9CA3AF' : '#9CA3AF'
                            }} />
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Ulangi password"
                                required
                                className={isDark ? 'dark-autofill' : ''}
                                style={{
                                    width: '100%',
                                    padding: `${spacing.md} ${spacing.md} ${spacing.md} 40px`,
                                    borderRadius: borderRadius.md,
                                    border: `1px solid ${isDark ? '#4B5563' : '#D1D5DB'}`,
                                    backgroundColor: isDark ? '#374151' : '#ffffff',
                                    color: isDark ? '#F3F4F6' : 'inherit',
                                    outline: 'none',
                                    transition: 'border-color 0.2s'
                                }}
                                onFocus={(e) => e.target.style.borderColor = isDark ? '#A7F3D0' : colors.primary.main}
                                onBlur={(e) => e.target.style.borderColor = isDark ? '#4B5563' : '#D1D5DB'}
                            />
                        </div>
                    </div>

                    <div style={{ marginBottom: spacing.lg }}>
                        <label style={{
                            display: 'block',
                            fontSize: '0.875rem',
                            fontWeight: 500,
                            color: isDark ? '#D1D5DB' : '#374151',
                            marginBottom: spacing.xs
                        }}>
                            Nomor WhatsApp
                        </label>
                        <div style={{ position: 'relative' }}>
                            <Phone size={18} style={{
                                position: 'absolute',
                                left: spacing.md,
                                top: '50%',
                                transform: 'translateY(-50%)',
                                color: isDark ? '#9CA3AF' : '#9CA3AF'
                            }} />
                            <input
                                type="tel"
                                value={phoneNumber}
                                onChange={(e) => setPhoneNumber(e.target.value)}
                                placeholder="08xxxxxxxxxx"
                                required
                                className={isDark ? 'dark-autofill' : ''}
                                style={{
                                    width: '100%',
                                    padding: `${spacing.md} ${spacing.md} ${spacing.md} 40px`,
                                    borderRadius: borderRadius.md,
                                    border: `1px solid ${isDark ? '#4B5563' : '#D1D5DB'}`,
                                    backgroundColor: isDark ? '#374151' : '#ffffff',
                                    color: isDark ? '#F3F4F6' : 'inherit',
                                    outline: 'none',
                                    transition: 'border-color 0.2s'
                                }}
                                onFocus={(e) => e.target.style.borderColor = isDark ? '#A7F3D0' : colors.primary.main}
                                onBlur={(e) => e.target.style.borderColor = isDark ? '#4B5563' : '#D1D5DB'}
                            />
                        </div>
                    </div>

                    {error && (
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: spacing.xs,
                            color: isDark ? '#FCA5A5' : '#DC2626',
                            backgroundColor: isDark ? 'rgba(220, 38, 38, 0.1)' : 'transparent',
                            padding: isDark ? spacing.sm : 0,
                            borderRadius: borderRadius.md,
                            fontSize: '0.875rem',
                            marginBottom: spacing.lg
                        }}>
                            <AlertCircle size={16} />
                            <span>{error}</span>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            width: '100%',
                            backgroundColor: colors.primary.main,
                            color: '#ffffff',
                            padding: spacing.md,
                            borderRadius: borderRadius.lg,
                            border: 'none',
                            fontWeight: 500,
                            cursor: loading ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: spacing.sm,
                            opacity: loading ? 0.8 : 1
                        }}
                    >
                        {loading ? 'Menyimpan...' : (
                            <>
                                <span>Simpan & Lanjutkan</span>
                                <Check size={18} />
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}
