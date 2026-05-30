import api from '../api/axios';

export const socialService = {
    rateNovel: (novelId, score) =>
        api.post(`/novels/${novelId}/rate`, { score }),
    getComments: (endpoint, skip = 0, limit = 10) =>
        api.get(`${endpoint}?skip=${skip}&limit=${limit}`),
    postComment: (endpoint, content) =>
        api.post(endpoint, { content }),
    deleteComment: (commentId) => api.delete(`/comments/${commentId}`),
};
