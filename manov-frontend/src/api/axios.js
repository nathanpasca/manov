import axios from 'axios';
import toast from 'react-hot-toast';

// Determine Base URL based on Environment
const baseURL =
    import.meta.env.MODE === 'production'
        ? import.meta.env.VITE_API_URL // In Production, use the Environment Variable (Set in Vercel)
        : 'http://localhost:8000/api'; // In Development, always use Localhost

// Create axios instance
const api = axios.create({
    baseURL: baseURL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Interceptor untuk otomatis inject token kalau ada
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Global response interceptor for error handling
api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Handle 401 Unauthorized globally
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            toast.error('Session expired. Please log in again.');
            window.location.href = '/login';
            return Promise.reject(error);
        }

        // Handle network errors
        if (!error.response) {
            toast.error('Network error. Please check your connection.');
            return Promise.reject(error);
        }

        // Re-throw for local handling
        return Promise.reject(error);
    }
);

export default api;
