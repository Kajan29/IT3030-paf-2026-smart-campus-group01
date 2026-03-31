import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import authService, { UserRole } from '../services/authService'

interface User {
  email: string
  firstName: string
  lastName: string
  username?: string
  phoneNumber?: string
  department?: string
  profilePicture?: string
  role: UserRole
  isVerified: boolean
}

type AuthContextType = {
  user: User | null
  login: (credentials: any) => Promise<any>
  googleLogin: (token: string, role?: UserRole) => Promise<any>
  logout: () => void
  register: (userData: any) => Promise<any>
  updateUser: (user: User) => void
  isAuthenticated: boolean
  loading: boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const currentUser = authService.getCurrentUser()
    if (currentUser) {
      if (authService.isSessionExpired()) {
        authService.logout()
      } else {
        setUser(currentUser)
      }
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    if (!user) return

    const trackActivity = () => authService.updateSessionActivity()
    const activityEvents: Array<keyof WindowEventMap> = [
      'click',
      'keydown',
      'mousemove',
      'scroll',
      'touchstart',
    ]

    activityEvents.forEach((eventName) => {
      window.addEventListener(eventName, trackActivity, { passive: true })
    })

    const intervalId = window.setInterval(() => {
      if (authService.isSessionExpired()) {
        authService.logout()
        setUser(null)
        if (!window.location.pathname.startsWith('/auth/')) {
          window.location.href = '/auth/login'
        }
      }
    }, 15000)

    return () => {
      activityEvents.forEach((eventName) => {
        window.removeEventListener(eventName, trackActivity)
      })
      window.clearInterval(intervalId)
    }
  }, [user])

  const login = async (credentials: any) => {
    const response = await authService.login(credentials)
    const { accessToken, token, ...userData } = response.data.data
    const effectiveToken = accessToken || token
    if (effectiveToken) {
      authService.saveAuthData(effectiveToken, userData)
      setUser(userData)
    }
    return response
  }

  const googleLogin = async (token: string, role?: UserRole) => {
    const response = await authService.googleAuth({ token, role })
    const { accessToken, token: jwtToken, ...userData } = response.data.data
    const effectiveToken = accessToken || jwtToken
    if (effectiveToken) {
      authService.saveAuthData(effectiveToken, userData)
      setUser(userData)
    }
    return response
  }

  const register = async (userData: any) => {
    const response = await authService.register(userData)
    // Note: After registration, user needs to verify email before getting token
    return response
  }

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser)
    const token = authService.getAccessToken()
    if (token) {
      authService.saveAuthData(token, updatedUser)
    }
  }

  const logout = () => {
    authService.serverLogout().catch(() => null).finally(() => {
      authService.logout()
      setUser(null)
    })
  }

  const value: AuthContextType = {
    user,
    login,
    googleLogin,
    logout,
    register,
    updateUser,
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
