import axios from 'axios'
import authService from './authService'

const API_URL = import.meta.env.VITE_API_URL || '/api'

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
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
    
    const token = authService.getAccessToken()
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
  async (error) => {
    const originalRequest = error.config as typeof error.config & { _retry?: boolean }
    const isAuthEndpoint = originalRequest?.url?.includes('/auth/')

    if (error.response?.status === 401 && !originalRequest?._retry && !isAuthEndpoint) {
      originalRequest._retry = true
      try {
        const refreshResponse = await axios.post(
          `${API_URL}/auth/refresh`,
          {},
          { withCredentials: true }
        )

        const refreshedToken =
          refreshResponse.data?.data?.accessToken ||
          refreshResponse.data?.data?.token

        if (refreshedToken) {
          authService.setAccessToken(refreshedToken)
          originalRequest.headers = originalRequest.headers || {}
          ;(originalRequest.headers as Record<string, string>).Authorization = `Bearer ${refreshedToken}`
          return api(originalRequest)
        }
      } catch (refreshError) {
        authService.logout()
        if (!window.location.pathname.startsWith('/auth/')) {
          window.location.href = '/auth/login'
        }
        return Promise.reject(refreshError)
      }
    }

    if (error.response?.status === 401) {
      authService.logout()
      if (!window.location.pathname.startsWith('/auth/')) {
        window.location.href = '/auth/login'
      }
    }
    return Promise.reject(error)
  }
)

export default api
