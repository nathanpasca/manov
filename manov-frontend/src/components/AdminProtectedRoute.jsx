import React from "react"
import { Navigate, useLocation } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"
import { LoadingSpinner } from "./LoadingSpinner" // Assuming you have this

export const AdminProtectedRoute = ({ children }) => {
  const { user, isLoading, token } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className='flex justify-center items-center h-screen'>
        <LoadingSpinner />
      </div>
    )
  }

  if (!user && !token) {
    // Not logged in
    return <Navigate to='/login' state={{ from: location }} replace />
  }

  if (user && !user.isAdmin) {
    // Logged in but not admin
    return <Navigate to='/' state={{ from: location }} replace /> // Redirect to home
  }

  return children // User is admin
}
