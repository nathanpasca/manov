import api from '../api/axios';

export const socialService = {
    rateNovel: (novelId, score) =>
        api.post(`/novels/${novelId}/rate`, { score }),
    getComments: (endpoint) => api.get(endpoint),
    postComment: (endpoint, content) =>
        api.post(endpoint, { content }),
    deleteComment: (commentId) => api.delete(`/comments/${commentId}`),
};
