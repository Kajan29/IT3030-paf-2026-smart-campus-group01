import axios from 'axios'
import authService from './authService'

const API_URL = import.meta.env.VITE_API_URL || '/api'

/** Pages guests can view without being redirected to login */
const PUBLIC_PATHS = ['/', '/about', '/contact', '/find-room', '/resources', '/gallery']

const isOnPublicPage = (): boolean => {
  const path = window.location.pathname
  return (
    PUBLIC_PATHS.includes(path) ||
    path.startsWith('/auth/')
  )
}

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

    // Only redirect on session expiry if user was previously logged in AND is on a protected page
    if (isSessionManagedEndpoint && authService.isSessionExpired()) {
      const hadSession = !!authService.getAccessToken()
      authService.logout()
      if (hadSession && !isOnPublicPage()) {
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
      config.headers = config.headers ?? axios.defaults.headers.common as typeof config.headers
      config.headers.Authorization = `Bearer ${token}`
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

    // On public pages, never redirect to login — just let the error propagate
    // so components can gracefully fall back to local/cached data
    if (isOnPublicPage()) {
      return Promise.reject(error)
    }

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
        window.location.href = '/auth/login'
        return Promise.reject(refreshError)
      }
    }

    if (status === 401 && shouldHandleAuthFailure) {
      authService.logout()
      window.location.href = '/auth/login'
    }
    return Promise.reject(error)
  }
)

export default api
