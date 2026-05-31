import api from '../api/axios';

export const userService = {
    getLibrary: () => api.get('/user/library'),
    addToLibrary: (novelId) => api.post(`/user/library/${novelId}`),
    removeFromLibrary: (novelId) => api.delete(`/user/library/${novelId}`),
    checkLibraryStatus: (novelId) => api.get(`/user/library/check/${novelId}`),
    getHistory: () => api.get('/user/history'),

    // Reading Progress
    updateProgress: (data) => api.post('/user/history/progress', data),

    // Notifications
    getNotifications: (skip = 0, limit = 20) =>
        api.get(`/user/notifications?skip=${skip}&limit=${limit}`),
    getUnreadCount: () => api.get('/user/notifications/unread-count'),
    markNotificationRead: (id) => api.post(`/user/notifications/${id}/read`),
    markAllNotificationsRead: () => api.post('/user/notifications/read-all'),
};
