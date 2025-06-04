import apiClient from "@/lib/api"

// Novels
export const fetchNovels = async (params = {}) => {
  const { data } = await apiClient.get("/novels", { params })
  return data
}

export const fetchNovelByIdentifier = async (identifier, params = {}) => {
  const { data } = await apiClient.get(`/novels/${identifier}`, { params })
  return data
}

// Authors
export const fetchAuthors = async (params = {}) => {
  const { data } = await apiClient.get("/authors", { params })
  return data
}

export const fetchAuthorById = async (authorId) => {
  const { data } = await apiClient.get(`/authors/${authorId}`)
  return data
}

// Languages
export const fetchLanguages = async () => {
  const { data } = await apiClient.get("/languages")
  return data
}

// Search
export const searchContent = async (params = {}) => {
  const { data } = await apiClient.get("/search", { params })
  // The backend searchService returns an object: { type, query, results, total, page, limit }
  // We'll likely use the 'results' and 'total' (or similar for pagination)
  return data
}

// Chapters
export const fetchChaptersByNovelId = async (novelId, params = {}) => {
  // Params can include: page, limit, isPublished, sortBy, sortOrder, lang
  // Example: { lang: 'en', page: 1, limit: 10, isPublished: true, sortBy: 'chapterNumber', sortOrder: 'asc' }
  const { data } = await apiClient.get(`/novels/${novelId}/chapters`, { params })
  return data // Assuming backend returns array of chapters, or object with { results: [], totalCount: X }
}

export const fetchChapterByNovelAndNumber = async (novelId, chapterNumber, params = {}) => {
  // Params can include: lang
  const { data } = await apiClient.get(`/novels/${novelId}/chapters/${chapterNumber}`, { params })
  return data
}

// Note: fetchChapterById(chapterId, { params }) can also be added if you prefer fetching by direct chapter ID.
// export const fetchChapterById = async (chapterId, params = {}) => {
//   const { data } = await apiClient.get(`/chapters/${chapterId}`, { params });
//   return data;
// };

// Reading Progress
export const upsertReadingProgress = async (novelId, progressData) => {
  // progressData: { chapterId, readingPosition, progressPercentage }
  const { data } = await apiClient.put(`/novels/${novelId}/progress`, progressData)
  return data
}

export const fetchReadingProgressForNovel = async (novelId) => {
  const { data } = await apiClient.get(`/novels/${novelId}/progress`)
  return data // Expects { novel, chapter, progressPercentage, readingPosition, ... } or null
}

export const fetchAllUserReadingProgress = async (params = {}) => {
  // Params can include: page, limit
  const { data } = await apiClient.get("/users/me/reading-progress", { params })
  return data // Expects array of progress entries, or object with { results: [], totalCount: X }
}

// --- Favorites ---
export const addNovelToFavorites = async (novelId) => {
  const { data } = await apiClient.post(`/novels/${novelId}/favorite`)
  return data // Backend returns the created UserFavorite object
}

export const removeNovelFromFavorites = async (novelId) => {
  // Backend returns 204 No Content on success
  await apiClient.delete(`/novels/${novelId}/favorite`)
}

export const fetchUserFavorites = async (params = {}) => {
  // Params: page, limit
  const { data } = await apiClient.get("/users/me/favorites", { params })
  // Backend userFavoriteService.getAllFavoritesForUser includes novel details
  return data // Expects { results: [], totalCount: X, ... } or array
}

// --- Ratings & Reviews ---
export const upsertNovelRating = async (novelId, ratingData) => {
  // ratingData: { rating: number, reviewText?: string }
  const { data } = await apiClient.post(`/novels/${novelId}/ratings`, ratingData)
  // Backend ratingService.upsertRating includes user details
  return data
}

export const fetchNovelRatings = async (novelId, params = {}) => {
  // Params: page, limit
  const { data } = await apiClient.get(`/novels/${novelId}/ratings`, { params })
  // Backend ratingService.getRatingsForNovel includes user details
  return data // Expects { results: [], totalCount: X, ... } or array
}

export const fetchUserRatingForNovel = async (novelId) => {
  const { data } = await apiClient.get(`/novels/${novelId}/ratings/me`)
  return data // Rating object or null
}

export const deleteUserRatingForNovel = async (novelId) => {
  // Backend returns 204 No Content on success
  await apiClient.delete(`/novels/${novelId}/ratings/me`)
}

// --- Comments ---
export const postNovelComment = async (novelId, commentData) => {
  // commentData: { content: string }
  const { data } = await apiClient.post(`/novels/${novelId}/comments`, commentData)
  return data // Backend commentService.createComment includes user details
}

export const postChapterComment = async (chapterId, commentData) => {
  // commentData: { content: string }
  const { data } = await apiClient.post(`/chapters/${chapterId}/comments`, commentData)
  return data
}

export const postReplyToComment = async (parentCommentId, commentData) => {
  // commentData: { content: string }
  const { data } = await apiClient.post(`/comments/${parentCommentId}/replies`, commentData)
  return data
}

export const fetchNovelComments = async (novelId, params = {}) => {
  // Params: page, limit, sortBy, sortOrder
  const { data } = await apiClient.get(`/novels/${novelId}/comments`, { params })
  // Backend commentService.getCommentsForNovel includes user details and replies
  return data // Expects { results: [], totalCount: X, ... } or array
}

export const fetchChapterComments = async (chapterId, params = {}) => {
  // Params: page, limit, sortBy, sortOrder
  const { data } = await apiClient.get(`/chapters/${chapterId}/comments`, { params })
  return data
}

export const updateCommentById = async (commentId, commentData) => {
  // commentData: { content: string }
  const { data } = await apiClient.put(`/comments/${commentId}`, commentData)
  return data
}

export const deleteCommentById = async (commentId) => {
  // Backend returns 204 No Content on success
  await apiClient.delete(`/comments/${commentId}`)
}
