import React, { createContext, useContext, useState, useEffect, useCallback } from "react"
import apiClient from "@/lib/api" // Your apiClient from src/lib/api.js
import { toast } from "sonner"

const AuthContext = createContext(null)

export const useAuth = () => useContext(AuthContext)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(() => localStorage.getItem("authToken")) // Raw token
  const [isLoading, setIsLoading] = useState(true)

  const setAuthData = useCallback((userData, rawAuthToken) => {
    setUser(userData)
    setToken(rawAuthToken)
    localStorage.setItem("authToken", rawAuthToken)
    // The apiClient interceptor will handle adding "Bearer " + rawAuthToken to headers
  }, [])

  const clearAuthData = useCallback(() => {
    setUser(null)
    setToken(null)
    localStorage.removeItem("authToken")
  }, [])

  const fetchUserProfile = useCallback(async () => {
    if (!token) {
      // Check raw token from state
      setIsLoading(false)
      return
    }
    setIsLoading(true)
    try {
      const response = await apiClient.get("/users/me")
      setUser(response.data)
    } catch (error) {
      console.error("Failed to fetch user profile:", error)
      clearAuthData()
      if (error.response && error.response.status !== 401) {
        toast.error("Could not load your profile. Please try logging in again.")
      }
    } finally {
      setIsLoading(false)
    }
  }, [token, clearAuthData])

  useEffect(() => {
    if (token && !user) {
      // If raw token exists, try fetching profile
      fetchUserProfile()
    } else {
      setIsLoading(false)
    }
  }, [token, user, fetchUserProfile])

  const register = async (userData) => {
    try {
      // Backend's /auth/register only returns user info, not a token
      const response = await apiClient.post("/auth/register", userData)
      toast.success(response.data.message || "Registration successful! Please log in.")
      // Does NOT call setAuthData as no token is returned from this endpoint.
      return response.data
    } catch (error) {
      console.error("Registration failed:", error)
      const errorMessage =
        error.response?.data?.errors?.[0]?.msg ||
        error.response?.data?.message ||
        "Registration failed. Please try again."
      toast.error(errorMessage)
      throw error
    }
  }

  const login = async (credentials) => {
    try {
      const response = await apiClient.post("/auth/login", credentials)
      if (response.data && response.data.token && response.data.user) {
        let rawToken = response.data.token
        if (rawToken.startsWith("Bearer ")) {
          rawToken = rawToken.substring(7) // Remove "Bearer " prefix to store raw token
        }
        setAuthData(response.data.user, rawToken)
        toast.success("Login successful! Welcome back.")
        return response.data
      } else {
        throw new Error("Login response did not include token and user data.")
      }
    } catch (error) {
      console.error("Login failed:", error)
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.errors?.[0]?.msg ||
        "Login failed. Please check your credentials."
      toast.error(errorMessage)
      throw error
    }
  }

  const logout = useCallback(() => {
    clearAuthData()
    toast.info("You have been logged out.")
  }, [clearAuthData])

  const updateUserProfileData = async (profileData) => {
    setIsLoading(true)
    try {
      const response = await apiClient.put("/users/me", profileData)
      setUser(response.data)
      toast.success("Profile updated successfully!")
      return response.data
    } catch (error) {
      console.error("Failed to update profile:", error)
      const errorMessage =
        error.response?.data?.message || error.response?.data?.errors?.[0]?.msg || "Failed to update profile."
      toast.error(errorMessage)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthContext.Provider
      value={{ user, token, isLoading, register, login, logout, fetchUserProfile, updateUserProfileData }}>
      {children}
    </AuthContext.Provider>
  )
}
