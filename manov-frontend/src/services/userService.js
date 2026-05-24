import api from '../api/axios';

export const userService = {
    getLibrary: () => api.get('/user/library'),
    addToLibrary: (novelId) => api.post(`/user/library/${novelId}`),
    removeFromLibrary: (novelId) => api.delete(`/user/library/${novelId}`),
    checkLibraryStatus: (novelId) => api.get(`/user/library/check/${novelId}`),
    getHistory: () => api.get('/user/history'),
};
