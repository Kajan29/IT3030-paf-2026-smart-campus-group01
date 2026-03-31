import api from './api'

export const userService = {
  getAll: () => api.get('/users'),
  getById: (id: number) => api.get(`/users/${id}`),
  create: (userData: unknown) => api.post('/users', userData),
  update: (id: number, userData: unknown) => api.put(`/users/${id}`, userData),
  delete: (id: number) => api.delete(`/users/${id}`),
  updateProfile: (formData: FormData) => api.put('/profile', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  getProfile: () => api.get('/profile/me'),
}

export default userService
