import api from '../api/axios';

export const socialService = {
    rateNovel: (novelId, score) =>
        api.post(`/novels/${novelId}/rate`, { score }),
    getComments: (endpoint, skip = 0, limit = 10) =>
        api.get(`${endpoint}?skip=${skip}&limit=${limit}`),
    postComment: (endpoint, content, parentId = null) =>
        api.post(endpoint, { content, parentId }),
    deleteComment: (commentId) => api.delete(`/comments/${commentId}`),

    // Reviews
    getReviews: (novelId, skip = 0, limit = 10) =>
        api.get(`/novels/${novelId}/reviews?skip=${skip}&limit=${limit}`),
    postReview: (novelId, score, content) =>
        api.post(`/novels/${novelId}/reviews`, { score, content }),
    updateReview: (reviewId, score, content) =>
        api.put(`/reviews/${reviewId}`, { score, content }),
    deleteReview: (reviewId) => api.delete(`/reviews/${reviewId}`),
};
