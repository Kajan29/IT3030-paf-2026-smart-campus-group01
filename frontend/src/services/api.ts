import axios from 'axios'
import authService from './authService'

const API_URL = import.meta.env.VITE_API_URL || '/api'

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use(
  (config) => {
    // Skip session check for auth endpoints
    const isAuthEndpoint = config.url?.includes('/auth/');
    
    if (!isAuthEndpoint && authService.isSessionExpired()) {
      authService.logout()
      if (!window.location.pathname.startsWith('/auth/')) {
        window.location.href = '/auth/login'
      }
      return Promise.reject(new axios.Cancel('Session expired'))
    }

    if (!isAuthEndpoint) {
      authService.updateSessionActivity()
    }
    
    const token = localStorage.getItem('token')
    if (token && config.headers) {
      ;(config.headers as Record<string, string>).Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/auth/login'
    }
    return Promise.reject(error)
  }
)

export default api
