import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ adminOnly = false }) => {
    const { user, token } = useAuth();

    // 1. Cek Login
    if (!token) {
        return <Navigate to="/login" replace />;
    }

    // 2. Cek Role (Jika halaman khusus Admin)
    if (adminOnly && user?.role !== 'ADMIN') {
        return <Navigate to="/" replace />; // User biasa dilarang masuk admin
    }

    return <Outlet />; // Lolos seleksi, silakan masuk
};

export default ProtectedRoute;