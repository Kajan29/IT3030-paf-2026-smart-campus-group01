import api from './api'

const SESSION_TIMEOUT_MINUTES = Number(import.meta.env.VITE_SESSION_TIMEOUT_MINUTES || 30)
const SESSION_TIMEOUT_MS = SESSION_TIMEOUT_MINUTES * 60 * 1000
const LAST_ACTIVITY_KEY = 'lastActivityAt'
const ACCESS_TOKEN_KEY = 'accessToken'

export type UserRole = 'STUDENT' | 'ACADEMIC_STAFF' | 'NON_ACADEMIC_STAFF' | 'ADMIN'

interface LoginCredentials {
  email: string
  password: string
}

interface RegisterData {
  firstName: string
  lastName: string
  email: string
  password: string
}

interface VerifyEmailData {
  email: string
  verificationCode: string
}

interface ForgotPasswordData {
  email: string
}

interface ResetPasswordData {
  email: string
  verificationCode: string
  newPassword: string
}

interface GoogleAuthData {
  token: string
  role?: UserRole
}

interface AuthResponse {
  success: boolean
  message: string
  data: {
    accessToken?: string
    refreshToken?: string
    token?: string
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
}

export const authService = {
  // Student Registration (requires email verification)
  register: (userData: RegisterData) => 
    api.post<AuthResponse>('/auth/register', userData),
  
  // Login for all user types
  login: (credentials: LoginCredentials) => 
    api.post<AuthResponse>('/auth/login', credentials),
  
  // Email verification
  verifyEmail: (data: VerifyEmailData) => 
    api.post<AuthResponse>('/auth/verify-email', data),
  
  // Resend verification code
  resendVerification: (email: string) => 
    api.post<AuthResponse>(`/auth/resend-verification?email=${encodeURIComponent(email)}`),
  
  // Forgot password (sends verification code)
  forgotPassword: (data: ForgotPasswordData) => 
    api.post<AuthResponse>('/auth/forgot-password', data),
  
  // Reset password with verification code
  resetPassword: (data: ResetPasswordData) => 
    api.post<AuthResponse>('/auth/reset-password', data),
  
  // Google Authentication
  googleAuth: (data: GoogleAuthData) => 
    api.post<AuthResponse>(`/auth/google?role=${data.role || 'STUDENT'}`, { token: data.token }),

  refresh: () => api.post<AuthResponse>('/auth/refresh', {}),

  serverLogout: () => api.post('/auth/logout', {}),
  
  // Logout
  logout: () => {
    localStorage.removeItem(ACCESS_TOKEN_KEY)
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    localStorage.removeItem(LAST_ACTIVITY_KEY)
  },
  
  // Get current user from localStorage
  getCurrentUser: () => {
    const user = localStorage.getItem('user')
    return user ? JSON.parse(user) : null
  },
  
  // Check if user is authenticated
  isAuthenticated: () => {
    return !!localStorage.getItem(ACCESS_TOKEN_KEY)
  },

  getSessionTimeoutMs: () => SESSION_TIMEOUT_MS,

  updateSessionActivity: () => {
    if (localStorage.getItem(ACCESS_TOKEN_KEY)) {
      localStorage.setItem(LAST_ACTIVITY_KEY, String(Date.now()))
    }
  },

  isSessionExpired: () => {
    const token = localStorage.getItem(ACCESS_TOKEN_KEY)
    if (!token) return false // No token means not logged in, not expired

    const lastActivityAt = Number(localStorage.getItem(LAST_ACTIVITY_KEY) || 0)
    if (!lastActivityAt) return false // If no activity timestamp, consider it fresh (just logged in)

    return Date.now() - lastActivityAt > SESSION_TIMEOUT_MS
  },
  
  // Get access token
  getAccessToken: () => {
    return localStorage.getItem(ACCESS_TOKEN_KEY)
  },

  // Keep backward compatibility where getToken is still used
  getToken: () => {
    return localStorage.getItem(ACCESS_TOKEN_KEY)
  },

  setAccessToken: (accessToken: string) => {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken)
    localStorage.setItem('token', accessToken)
  },
  
  // Save user and access token
  saveAuthData: (accessToken: string, user: any) => {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken)
    localStorage.setItem('token', accessToken)
    localStorage.setItem('user', JSON.stringify(user))
    localStorage.setItem(LAST_ACTIVITY_KEY, String(Date.now()))
  },
}

export default authService
