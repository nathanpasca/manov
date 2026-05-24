import api from '../api/axios';

export const adminService = {
    getNovels: (skip = 0, limit = 100) =>
        api.get(`/novels?skip=${skip}&limit=${limit}`),
    getNovelCount: () => api.get('/novels/count'),
    createNovel: (data) => api.post('/admin/novels', data),
    updateNovel: (id, data) => api.put(`/admin/novels/${id}`, data),
    deleteNovel: (id) => api.delete(`/admin/novels/${id}`),
    createChapter: (novelId, data) =>
        api.post(`/admin/novels/${novelId}/chapters`, data),
    updateChapter: (translationId, data) =>
        api.put(`/admin/chapters/${translationId}`, data),
    deleteChapter: (id) => api.delete(`/admin/chapters/${id}`),
    triggerScrape: (data) => api.post('/admin/scrape', data),
    getGenres: () => api.get('/genres'),
    createGenre: (name) => api.post('/admin/genres', { name }),
    deleteGenre: (id) => api.delete(`/admin/genres/${id}`),
};
