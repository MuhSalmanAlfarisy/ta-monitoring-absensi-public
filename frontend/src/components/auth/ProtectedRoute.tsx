import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { colors } from '../../lib/theme';
import { hasValidSessionToken } from '../../lib/axios';

export function ProtectedRoute({ children }: { children: JSX.Element }) {
    const { user, loading } = useAuth();
    const location = useLocation();

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
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return children;
}
