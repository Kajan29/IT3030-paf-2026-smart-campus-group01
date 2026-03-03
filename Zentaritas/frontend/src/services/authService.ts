import api from './api'

export const authService = {
  login: (credentials: unknown) => api.post('/auth/login', credentials),
  register: (userData: unknown) => api.post('/auth/register', userData),
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
}

export default authService
