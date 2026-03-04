import api from './api'

interface LoginCredentials {
  identifier: string
  password: string
}

interface RegisterData {
  firstName: string
  lastName: string
  email: string
  phone: string
  password: string
  idCard?: File
}

export const authService = {
  login: (credentials: LoginCredentials) => api.post('/auth/login', credentials),
  
  register: (userData: RegisterData | FormData) => {
    const config = userData instanceof FormData 
      ? { headers: { 'Content-Type': 'multipart/form-data' } }
      : {}
    return api.post('/auth/register', userData, config)
  },
  
  forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }),
  
  verifyOtp: (email: string, otp: string) => api.post('/auth/verify-otp', { email, otp }),
  
  resendOtp: (email: string) => api.post('/auth/resend-otp', { email }),
  
  logout: () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  },
  
  getCurrentUser: () => {
    const user = localStorage.getItem('user')
    return user ? JSON.parse(user) : null
  },
  
  isAuthenticated: () => {
    return !!localStorage.getItem('token')
  },
  
  getToken: () => {
    return localStorage.getItem('token')
  },
}

export default authService
