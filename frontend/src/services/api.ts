import axios from 'axios'
import authService from './authService'

const API_URL = import.meta.env.VITE_API_URL || '/api'

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
})

api.interceptors.request.use(
  (config) => {
    // Skip strict session handling for auth and public endpoints
    const isAuthEndpoint = config.url?.includes('/auth/');
    const isPublicEndpoint = config.url?.includes('/public/');
    const isSessionManagedEndpoint = !isAuthEndpoint && !isPublicEndpoint;
    
    if (isSessionManagedEndpoint && authService.isSessionExpired()) {
      authService.logout()
      if (!window.location.pathname.startsWith('/auth/')) {
        window.location.href = '/auth/login'
      }
      return Promise.reject(new axios.Cancel('Session expired'))
    }

    if (isSessionManagedEndpoint) {
      authService.updateSessionActivity()
    }
    
    const token = authService.getAccessToken()
    const shouldAttachToken = !isAuthEndpoint && token && (!isPublicEndpoint || !authService.isSessionExpired())
    if (shouldAttachToken) {
      config.headers = config.headers || {}
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
    const isPublicEndpoint = originalRequest?.url?.includes('/public/')
    const shouldHandleAuthFailure = !isAuthEndpoint && !isPublicEndpoint
    const status = error.response?.status

    if ((status === 401 || status === 403) && !originalRequest?._retry && shouldHandleAuthFailure) {
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

    if (status === 401 && shouldHandleAuthFailure) {
      authService.logout()
      if (!window.location.pathname.startsWith('/auth/')) {
        window.location.href = '/auth/login'
      }
    }
    return Promise.reject(error)
  }
)

export default api
