import axios from 'axios';

const API_URL = import.meta.env.PUBLIC_API_URL || 'http://localhost:8000/api';

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Browser-only interceptor
if (typeof window !== 'undefined') {
  apiClient.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.dispatchEvent(new Event('auth-change'));
      }
      return Promise.reject(error);
    }
  );
}

export const api = {
  // Novels
  getNovels: (params?: Record<string, any>) =>
    apiClient.get('/novels', { params }).then((r) => r.data),
  getNovel: (slug: string) =>
    apiClient.get(`/novels/${slug}`).then((r) => r.data),
  getChapter: (slug: string, chapterNum: number | string) =>
    apiClient.get(`/novels/${slug}/chapters/${chapterNum}`).then((r) => r.data),
  getGenres: () => apiClient.get('/genres').then((r) => r.data),
  getTrending: () => apiClient.get('/novels/trending').then((r) => r.data),
  trackView: (slug: string) =>
    apiClient.post(`/novels/${slug}/track-view`).then((r) => r.data),
  getNovelCount: () => apiClient.get('/novels/count').then((r) => r.data),

  // Auth
  login: (formData: { email: string; password: string }) =>
    apiClient.post('/auth/login', formData).then((r) => r.data),
  register: (formData: { email: string; password: string; username: string }) =>
    apiClient.post('/auth/register', formData).then((r) => r.data),
  me: () => apiClient.get('/auth/me').then((r) => r.data),
  forgotPassword: (email: string) =>
    apiClient.post('/auth/forgot-password', { email }).then((r) => r.data),
  resetPassword: (token: string, new_password: string) =>
    apiClient.post('/auth/reset-password', { token, new_password }).then((r) => r.data),

  // User
  getLibrary: () => apiClient.get('/user/library').then((r) => r.data),
  addToLibrary: (novelId: string) =>
    apiClient.post(`/user/library/${novelId}`).then((r) => r.data),
  removeFromLibrary: (novelId: string) =>
    apiClient.delete(`/user/library/${novelId}`).then((r) => r.data),
  checkLibraryStatus: (novelId: string) =>
    apiClient.get(`/user/library/check/${novelId}`).then((r) => r.data),
  getHistory: () => apiClient.get('/user/history').then((r) => r.data),
  updateProgress: (data: {
    novelId: string;
    chapterNum: number;
    scrollPosition: number;
    progressPercent: number;
  }) => apiClient.post('/user/history/progress', data).then((r) => r.data),

  // Notifications
  getNotifications: (skip = 0, limit = 20) =>
    apiClient.get(`/user/notifications?skip=${skip}&limit=${limit}`).then((r) => r.data),
  getUnreadCount: () =>
    apiClient.get('/user/notifications/unread-count').then((r) => r.data),
  markNotificationRead: (id: string) =>
    apiClient.post(`/user/notifications/${id}/read`).then((r) => r.data),
  markAllNotificationsRead: () =>
    apiClient.post('/user/notifications/read-all').then((r) => r.data),

  // Social
  rateNovel: (novelId: string, score: number) =>
    apiClient.post(`/novels/${novelId}/rate`, { score }).then((r) => r.data),
  getComments: (endpoint: string, skip = 0, limit = 10) =>
    apiClient.get(`${endpoint}?skip=${skip}&limit=${limit}`).then((r) => r.data),
  postComment: (endpoint: string, content: string, parentId?: string | null) =>
    apiClient.post(endpoint, { content, parentId }).then((r) => r.data),
  deleteComment: (commentId: string) =>
    apiClient.delete(`/comments/${commentId}`).then((r) => r.data),
  getReviews: (novelId: string, skip = 0, limit = 10) =>
    apiClient.get(`/novels/${novelId}/reviews?skip=${skip}&limit=${limit}`).then((r) => r.data),
  postReview: (novelId: string, score: number, content: string) =>
    apiClient.post(`/novels/${novelId}/reviews`, { score, content }).then((r) => r.data),
  updateReview: (reviewId: string, score: number, content: string) =>
    apiClient.put(`/reviews/${reviewId}`, { score, content }).then((r) => r.data),
  deleteReview: (reviewId: string) =>
    apiClient.delete(`/reviews/${reviewId}`).then((r) => r.data),

  // Admin
  createNovel: (data: any) =>
    apiClient.post('/admin/novels', data).then((r) => r.data),
  updateNovel: (id: string, data: any) =>
    apiClient.put(`/admin/novels/${id}`, data).then((r) => r.data),
  deleteNovel: (id: string) =>
    apiClient.delete(`/admin/novels/${id}`).then((r) => r.data),
  createChapter: (novelId: string, data: any) =>
    apiClient.post(`/admin/novels/${novelId}/chapters`, data).then((r) => r.data),
  updateChapter: (translationId: string, data: any) =>
    apiClient.put(`/admin/chapters/${translationId}`, data).then((r) => r.data),
  deleteChapter: (id: string) =>
    apiClient.delete(`/admin/chapters/${id}`).then((r) => r.data),
  triggerScrape: (data: any) =>
    apiClient.post('/admin/scrape', data).then((r) => r.data),
  createGenre: (name: string) =>
    apiClient.post('/admin/genres', { name }).then((r) => r.data),
  deleteGenre: (id: string) =>
    apiClient.delete(`/admin/genres/${id}`).then((r) => r.data),
};
