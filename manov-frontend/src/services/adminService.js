import apiClient from "@/lib/api"

export const adminFetchUsers = async (params = {}) => {
  // params: page, limit, isActive, isAdmin, sortBy, sortOrder
  const { data } = await apiClient.get("/admin/users", { params })
  // Expects: { results: [], totalCount: X, page: Y, limit: Z, totalPages: W }
  return data
}

export const adminFetchUserDetails = async (userId) => {
  const { data } = await apiClient.get(`/admin/users/${userId}`)
  return data
}

export const adminUpdateUser = async (userId, userData) => {
  // userData: displayName, email, isActive, isAdmin, preferredLanguage, avatarUrl
  const { data } = await apiClient.put(`/admin/users/${userId}`, userData)
  return data
}

export const adminDeactivateUser = async (userId) => {
  // Backend soft deletes (isActive: false)
  const { data } = await apiClient.delete(`/admin/users/${userId}`)
  return data // { message, user }
}

// --- Language Management ---
export const adminFetchLanguages = async (params = {}) => {
  // Backend currently returns an array for languages. Pagination can be added later if needed.
  const { data } = await apiClient.get("/languages", { params }) // Uses public route, ensure it's sufficient
  return data // Expects array of languages: [{ id, code, name, nativeName, isActive }]
}

export const adminCreateLanguage = async (languageData) => {
  // languageData: { code, name, nativeName?, isActive? }
  const { data } = await apiClient.post("/languages", languageData) // Admin protected route
  return data
}

export const adminUpdateLanguage = async (languageId, languageData) => {
  const { data } = await apiClient.put(`/languages/${languageId}`, languageData) // Admin protected route
  return data
}

export const adminDeleteLanguage = async (languageId) => {
  // Backend returns 204 No Content on success
  await apiClient.delete(`/languages/${languageId}`) // Admin protected route
}

// --- Author Management ---
export const adminFetchAuthors = async (params = {}) => {
  // params: page, limit, isActive, sortBy, sortOrder (similar to adminFetchUsers)
  const { data } = await apiClient.get("/authors", { params }) // Uses public route with pagination
  // Expects: { results: [], totalCount: X, page: Y, limit: Z, totalPages: W }
  return data
}

export const adminFetchAuthorDetails = async (authorId) => {
  // Public route, but useful for pre-filling edit form
  const { data } = await apiClient.get(`/authors/${authorId}`)
  return data
}

export const adminCreateAuthor = async (authorData) => {
  const { data } = await apiClient.post("/authors", authorData) // Admin protected route
  return data
}

export const adminUpdateAuthor = async (authorId, authorData) => {
  const { data } = await apiClient.put(`/authors/${authorId}`, authorData) // Admin protected route
  return data
}

export const adminDeleteAuthor = async (authorId) => {
  // Backend returns 204 No Content on success
  await apiClient.delete(`/authors/${authorId}`) // Admin protected route
}

// --- Novel Management (Admin) ---
export const adminFetchNovelsList = async (params = {}) => {
  // params: page, limit, isActive, publicationStatus, originalLanguage, genre, sortBy, sortOrder, lang, etc.
  // Uses the public GET /novels endpoint which supports pagination & filtering.
  const { data } = await apiClient.get("/novels", { params })
  // Expects: { results: [], totalCount: X, page: Y, limit: Z, totalPages: W }
  return data
}

export const adminCreateNovel = async (novelData) => {
  const { data } = await apiClient.post("/novels", novelData) // Admin protected
  return data
}

export const adminFetchNovelDetails = async (identifier, params = {}) => {
  // identifier can be ID or slug. params for lang if needed.
  const { data } = await apiClient.get(`/novels/${identifier}`, { params }) // Public endpoint
  return data
}

export const adminUpdateNovel = async (novelId, novelData) => {
  const { data } = await apiClient.put(`/novels/${novelId}`, novelData) // Admin protected
  return data
}

export const adminDeleteNovel = async (novelId) => {
  await apiClient.delete(`/novels/${novelId}`) // Admin protected
}

// --- Chapter Management (Admin) ---
export const adminFetchChaptersList = async (novelId, params = {}) => {
  // params: page, limit, isPublished, sortBy, sortOrder, lang
  const { data } = await apiClient.get(`/novels/${novelId}/chapters`, { params }) // Public endpoint
  // Expects: { results: [], totalCount: X, page: Y, limit: Z, totalPages: W }
  return data
}

export const adminCreateChapter = async (novelId, chapterData) => {
  const { data } = await apiClient.post(`/novels/${novelId}/chapters`, chapterData) // Admin protected
  return data
}

export const adminFetchChapterDetails = async (chapterId, params = {}) => {
  // params for lang if needed
  const { data } = await apiClient.get(`/chapters/${chapterId}`, { params }) // Public endpoint
  return data
}
// Or by novelId and chapterNumber:
// export const adminFetchChapterByNovelAndNumber = async (novelId, chapterNumber, params = {}) => {
//   const { data } = await apiClient.get(`/novels/${novelId}/chapters/${chapterNumber}`, { params });
//   return data;
// };

export const adminUpdateChapter = async (chapterId, chapterData) => {
  const { data } = await apiClient.put(`/chapters/${chapterId}`, chapterData) // Admin protected
  return data
}

export const adminDeleteChapter = async (chapterId) => {
  await apiClient.delete(`/chapters/${chapterId}`) // Admin protected
}

// --- Novel Translation Management ---
export const adminFetchNovelTranslations = async (novelId) => {
  const { data } = await apiClient.get(`/admin/novels/${novelId}/translations`)
  return data
}

export const adminCreateNovelTranslation = async (novelId, translationData) => {
  // languageCode must be in translationData for creation
  const { data } = await apiClient.post(`/admin/novels/${novelId}/translations`, translationData)
  return data
}

export const adminUpdateNovelTranslation = async (novelId, languageCode, translationData) => {
  const { data } = await apiClient.put(`/admin/novels/${novelId}/translations/${languageCode}`, translationData)
  return data
}

export const adminDeleteNovelTranslation = async (novelId, languageCode) => {
  await apiClient.delete(`/admin/novels/${novelId}/translations/${languageCode}`)
}

// --- Chapter Translation Management ---
export const adminFetchChapterTranslations = async (chapterId) => {
  const { data } = await apiClient.get(`/admin/chapters/${chapterId}/translations`)
  return data
}

export const adminCreateChapterTranslation = async (chapterId, translationData) => {
  const { data } = await apiClient.post(`/admin/chapters/${chapterId}/translations`, translationData)
  return data
}

export const adminUpdateChapterTranslation = async (chapterId, languageCode, translationData) => {
  const { data } = await apiClient.put(`/admin/chapters/${chapterId}/translations/${languageCode}`, translationData)
  return data
}

export const adminDeleteChapterTranslation = async (chapterId, languageCode) => {
  await apiClient.delete(`/admin/chapters/${chapterId}/translations/${languageCode}`)
}
