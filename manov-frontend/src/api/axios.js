import axios from 'axios';

// Determine Base URL based on Environment
const baseURL = import.meta.env.MODE === 'production'
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

export default api;
