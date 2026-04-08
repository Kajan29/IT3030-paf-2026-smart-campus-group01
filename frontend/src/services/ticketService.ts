import api from './api'
import type { UserRole } from './authService'

export type TicketCategory =
  | 'IT_SUPPORT'
  | 'FACILITIES'
  | 'ACADEMIC'
  | 'ROOM_BOOKING'
  | 'GENERAL_INQUIRY'

export type TicketAudience = 'STUDENT' | 'STAFF'
export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED'

export interface TicketResponse {
  id: number
  ticketNumber: string
  subject: string
  description: string
  category: TicketCategory
  audience: TicketAudience
  priority: TicketPriority
  status: TicketStatus
  requesterName: string
  requesterEmail: string
  requesterRole?: UserRole
  assignedStaffId?: number
  assignedStaffName?: string
  assignedStaffEmail?: string
  assignedAt?: string
  resolutionNote?: string
  resolvedByName?: string
  createdAt: string
  updatedAt: string
  resolvedAt?: string
}

export interface CreateTicketRequest {
  category: TicketCategory
  audience: TicketAudience
  priority?: TicketPriority
  subject: string
  description: string
  name?: string
  email?: string
}

export interface AssignableStaff {
  id: number
  email: string
  username?: string
  firstName?: string
  lastName?: string
  profilePicture?: string
}

type ApiEnvelope<T> = {
  success: boolean
  message: string
  data: T
}

export const ticketService = {
  createPublicTicket: (payload: CreateTicketRequest) =>
    api.post<ApiEnvelope<TicketResponse>>('/public/tickets', payload),

  getMyTickets: () => api.get<ApiEnvelope<TicketResponse[]>>('/tickets/my'),

  getAssignedTickets: () => api.get<ApiEnvelope<TicketResponse[]>>('/tickets/assigned'),

  resolveAssignedTicket: (ticketId: number, resolutionNote?: string) =>
    api.patch<ApiEnvelope<TicketResponse>>(`/tickets/${ticketId}/resolve`, { resolutionNote }),

  getAllAdminTickets: (status?: TicketStatus) =>
    api.get<ApiEnvelope<TicketResponse[]>>('/admin/tickets', {
      params: status ? { status } : undefined,
    }),

  getAssignableStaff: () =>
    api.get<ApiEnvelope<AssignableStaff[]>>('/admin/tickets/assignable-staff'),

  assignTicket: (ticketId: number, staffId: number) =>
    api.patch<ApiEnvelope<TicketResponse>>(`/admin/tickets/${ticketId}/assign`, { staffId }),

  resolveTicketByAdmin: (ticketId: number, resolutionNote?: string) =>
    api.patch<ApiEnvelope<TicketResponse>>(`/admin/tickets/${ticketId}/resolve`, { resolutionNote }),
}

export default ticketService
