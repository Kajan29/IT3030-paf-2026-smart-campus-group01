import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import authService, { UserRole } from '../services/authService'

interface User {
  email: string
  firstName: string
  lastName: string
  role: UserRole
  isVerified: boolean
}

type AuthContextType = {
  user: User | null
  login: (credentials: any) => Promise<any>
  logout: () => void
  register: (userData: any) => Promise<any>
  isAuthenticated: boolean
  loading: boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const currentUser = authService.getCurrentUser()
    if (currentUser) setUser(currentUser)
    setLoading(false)
  }, [])

  const login = async (credentials: any) => {
    const response = await authService.login(credentials)
    const { token, ...userData } = response.data.data
    if (token) {
      authService.saveAuthData(token, userData)
      setUser(userData)
    }
    return response
  }

  const register = async (userData: any) => {
    const response = await authService.register(userData)
    // Note: After registration, user needs to verify email before getting token
    return response
  }

  const logout = () => {
    authService.logout()
    setUser(null)
  }

  const value: AuthContextType = {
    user,
    login,
    logout,
    register,
    isAuthenticated: !!user,
    loading,
  }

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within an AuthProvider')
  return context
}

export default AuthContext
