import { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

interface GuestOnlyRouteProps {
  children: ReactNode
}

const GuestOnlyRoute = ({ children }: GuestOnlyRouteProps) => {
  const { user, isAuthenticated, loading } = useAuth()

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
      </div>
    )
  }

  if (isAuthenticated) {
    const redirectPath = user?.role === 'ADMIN' ? '/admin/dashboard' : '/'
    return <Navigate to={redirectPath} replace />
  }

  return <>{children}</>
}

export default GuestOnlyRoute
