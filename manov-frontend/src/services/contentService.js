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
