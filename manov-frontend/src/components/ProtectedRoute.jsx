import React from "react"
import { Navigate, useLocation } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"

export const ProtectedRoute = ({ children }) => {
  const { user, isLoading, token } = useAuth()
  const location = useLocation()

  if (isLoading) {
    // You can return a loading spinner here
    return (
      <div className='flex justify-center items-center h-screen'>
        <p>Loading authentication status...</p>
      </div>
    )
  }

  if (!user && !token) {
    // Check token as well, user might not be loaded yet on first render
    return <Navigate to='/login' state={{ from: location }} replace />
  }

  return children
}
