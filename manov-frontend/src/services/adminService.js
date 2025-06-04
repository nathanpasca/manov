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
