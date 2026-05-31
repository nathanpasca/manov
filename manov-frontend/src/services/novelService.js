import api from '../api/axios';

export const novelService = {
    getAll: (params = {}) => {
        const query = new URLSearchParams();
        if (params.skip !== undefined) query.set('skip', params.skip);
        if (params.limit !== undefined) query.set('limit', params.limit);
        if (params.q) query.set('q', params.q);
        if (params.sort_by) query.set('sort_by', params.sort_by);
        if (params.sort_order) query.set('sort_order', params.sort_order);
        if (params.status) query.set('status', params.status);
        if (params.genre_id) query.set('genre_id', params.genre_id);
        return api.get(`/novels?${query.toString()}`);
    },
    getCount: () => api.get('/novels/count'),
    getBySlug: (slug) => api.get(`/novels/${slug}`),
    getChapter: (slug, chapterNum) =>
        api.get(`/novels/${slug}/chapters/${chapterNum}`),
    getGenres: () => api.get('/genres'),
    getTrending: () => api.get('/novels/trending'),
    trackView: (slug) => api.post(`/novels/${slug}/track-view`),
};
