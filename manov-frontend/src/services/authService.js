import api from '../api/axios';

export const authService = {
    login: (formData) => api.post('/auth/login', formData),
    register: (formData) => api.post('/auth/register', formData),
    me: () => api.get('/auth/me'),
};
