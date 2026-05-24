import api from '../api/axios';

export const novelService = {
    getAll: (skip = 0, limit = 20) => api.get(`/novels?skip=${skip}&limit=${limit}`),
    getCount: () => api.get('/novels/count'),
    getBySlug: (slug) => api.get(`/novels/${slug}`),
    getChapter: (slug, chapterNum) =>
        api.get(`/novels/${slug}/chapters/${chapterNum}`),
    getGenres: () => api.get('/genres'),
};
