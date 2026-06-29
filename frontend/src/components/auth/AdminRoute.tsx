import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { colors } from '../../lib/theme';
import { hasValidSessionToken } from '../../lib/axios';

export function AdminRoute({ children }: { children: JSX.Element }) {
    const { user, role, loading } = useAuth();

    if (loading) {
        return (
            <div style={{
                height: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: colors.primary.main
            }}>
                Loading...
            </div>
        );
    }

    const isAuthenticated = Boolean(user) && hasValidSessionToken();
    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (role !== 'king_admin') {
        return <Navigate to="/dashboard" replace />;
    }

    return children;
}
