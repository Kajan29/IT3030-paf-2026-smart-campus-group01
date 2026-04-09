import { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

interface StudentProtectedRouteProps {
  children: ReactNode
}

const StudentProtectedRoute = ({ children }: StudentProtectedRouteProps) => {
  const { user, isAuthenticated, loading } = useAuth()

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" replace />
  }

  if (user?.role !== 'STUDENT') {
    if (user?.role === 'ADMIN') {
      return <Navigate to="/admin/dashboard" replace />
    }
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}

export default StudentProtectedRoute
