import api from './api';

export interface UserResponse {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: 'STUDENT' | 'ACADEMIC_STAFF' | 'NON_ACADEMIC_STAFF' | 'ADMIN';
  isVerified: boolean;
  isActive: boolean;
  profilePicture: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateStaffRequest {
  email: string;
  firstName: string;
  lastName: string;
  role: 'ACADEMIC_STAFF' | 'NON_ACADEMIC_STAFF';
  sendEmail?: boolean;
}

export interface StaffCreationResponse {
  user: UserResponse;
  defaultPassword: string;
  emailSent: boolean;
  message: string;
}

export interface UpdateUserStatusRequest {
  isActive: boolean;
  reason?: string;
}

export const adminUserService = {
  getAllUsers: () => api.get<{ data: UserResponse[] }>('/admin/users'),
  
  getStudents: () => api.get<{ data: UserResponse[] }>('/admin/users/students'),
  
  getStaff: () => api.get<{ data: UserResponse[] }>('/admin/users/staff'),
  
  getUsersByRole: (role: string) => api.get<{ data: UserResponse[] }>(`/admin/users/role/${role}`),
  
  getUserById: (id: number) => api.get<{ data: UserResponse }>(`/admin/users/${id}`),
  
  createStaffAccount: (data: CreateStaffRequest) => 
    api.post<{ data: StaffCreationResponse }>('/admin/users/staff', data),
  
  importStaffFromExcel: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post<{ data: StaffCreationResponse[] }>('/admin/users/staff/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  
  updateUserStatus: (id: number, data: UpdateUserStatusRequest) => 
    api.patch<{ data: UserResponse }>(`/admin/users/${id}/status`, data),
  
  deleteUser: (id: number) => api.delete(`/admin/users/${id}`),
};

export default adminUserService;
