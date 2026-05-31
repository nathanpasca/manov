import api from '../api/axios';

export const authService = {
    login: (formData) => api.post('/auth/login', formData),
    register: (formData) => api.post('/auth/register', formData),
    me: () => api.get('/auth/me'),
    forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
    resetPassword: (token, new_password) =>
        api.post('/auth/reset-password', { token, new_password }),
};
