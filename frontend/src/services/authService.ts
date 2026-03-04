import api from './api'

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
    token?: string
    email: string
    firstName: string
    lastName: string
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
    api.post<AuthResponse>(`/auth/resend-verification?email=${email}`),
  
  // Forgot password (sends verification code)
  forgotPassword: (data: ForgotPasswordData) => 
    api.post<AuthResponse>('/auth/forgot-password', data),
  
  // Reset password with verification code
  resetPassword: (data: ResetPasswordData) => 
    api.post<AuthResponse>('/auth/reset-password', data),
  
  // Google Authentication
  googleAuth: (data: GoogleAuthData) => 
    api.post<AuthResponse>(`/auth/google?role=${data.role || 'STUDENT'}`, { token: data.token }),
  
  // Logout
  logout: () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  },
  
  // Get current user from localStorage
  getCurrentUser: () => {
    const user = localStorage.getItem('user')
    return user ? JSON.parse(user) : null
  },
  
  // Check if user is authenticated
  isAuthenticated: () => {
    return !!localStorage.getItem('token')
  },
  
  // Get auth token
  getToken: () => {
    return localStorage.getItem('token')
  },
  
  // Save user and token
  saveAuthData: (token: string, user: any) => {
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(user))
  },
}

export default authService
