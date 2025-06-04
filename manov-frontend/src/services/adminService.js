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
