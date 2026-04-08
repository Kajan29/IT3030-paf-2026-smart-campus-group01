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
export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED' | 'REJECTED'

export const MAX_TICKET_ATTACHMENTS = 3
export const MAX_TICKET_ATTACHMENT_SIZE_BYTES = 5 * 1024 * 1024
export const ALLOWED_TICKET_ATTACHMENT_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

export const validateTicketAttachments = (attachments?: File[]): string | null => {
  const files = attachments || []

  if (files.length > MAX_TICKET_ATTACHMENTS) {
    return `You can upload up to ${MAX_TICKET_ATTACHMENTS} evidence images per ticket.`
  }

  for (const file of files) {
    if (!file) {
      continue
    }

    if (!ALLOWED_TICKET_ATTACHMENT_TYPES.includes(file.type)) {
      return 'Only JPG, PNG, WEBP, and GIF images are allowed.'
    }

    if (file.size > MAX_TICKET_ATTACHMENT_SIZE_BYTES) {
      return 'Each evidence image must be 5MB or smaller.'
    }
  }

  return null
}

export interface TicketAttachment {
  id: number
  imageUrl: string
  originalFileName?: string
  createdAt: string
}

export interface TicketResponse {
  id: number
  ticketNumber: string
  subject: string
  description: string
  resourceLocation?: string
  preferredContactDetails?: string
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
  rejectionReason?: string
  resolvedByName?: string
  closedByName?: string
  createdAt: string
  updatedAt: string
  resolvedAt?: string
  closedAt?: string
  attachments?: TicketAttachment[]
}

export interface CreateTicketRequest {
  category: TicketCategory
  audience: TicketAudience
  priority?: TicketPriority
  subject: string
  description: string
  resourceLocation: string
  preferredContactDetails: string
  name?: string
  email?: string
  attachments?: File[]
}

export interface AssignableStaff {
  id: number
  email: string
  username?: string
  firstName?: string
  lastName?: string
  profilePicture?: string
}

export interface TicketReply {
  id: number
  ticketId: number
  senderUserId?: number
  senderName: string
  senderEmail?: string
  senderRole?: UserRole
  message: string
  editedAt?: string
  createdAt: string
}

type ApiEnvelope<T> = {
  success: boolean
  message: string
  data: T
}

export const ticketService = {
  createPublicTicket: (payload: CreateTicketRequest) => {
    const formData = new FormData()
    const { attachments, ...data } = payload

    const attachmentValidationError = validateTicketAttachments(attachments)
    if (attachmentValidationError) {
      throw new Error(attachmentValidationError)
    }

    formData.append(
      'data',
      new Blob([JSON.stringify(data)], {
        type: 'application/json',
      })
    )

    ;(attachments || []).slice(0, 3).forEach((file) => {
      formData.append('attachments', file)
    })

    return api.post<ApiEnvelope<TicketResponse>>('/public/tickets', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
  },

  getMyTickets: () => api.get<ApiEnvelope<TicketResponse[]>>('/tickets/my'),

  getAssignedTickets: () => api.get<ApiEnvelope<TicketResponse[]>>('/tickets/assigned'),

  getTicketReplies: (ticketId: number) =>
    api.get<ApiEnvelope<TicketReply[]>>(`/tickets/${ticketId}/replies`),

  addTicketReply: (ticketId: number, message: string) =>
    api.post<ApiEnvelope<TicketReply>>(`/tickets/${ticketId}/replies`, { message }),

  updateTicketReply: (ticketId: number, messageId: number, message: string) =>
    api.patch<ApiEnvelope<TicketReply>>(`/tickets/${ticketId}/replies/${messageId}`, { message }),

  deleteTicketReply: (ticketId: number, messageId: number) =>
    api.delete<ApiEnvelope<void>>(`/tickets/${ticketId}/replies/${messageId}`),

  resolveAssignedTicket: (ticketId: number, resolutionNote?: string) =>
    api.patch<ApiEnvelope<TicketResponse>>(`/tickets/${ticketId}/resolve`, { resolutionNote }),

  markAssignedTicketInProgress: (ticketId: number) =>
    api.patch<ApiEnvelope<TicketResponse>>(`/tickets/${ticketId}/in-progress`),

  closeTicket: (ticketId: number) =>
    api.patch<ApiEnvelope<TicketResponse>>(`/tickets/${ticketId}/close`),

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

  rejectTicketByAdmin: (ticketId: number, reason: string) =>
    api.patch<ApiEnvelope<TicketResponse>>(`/admin/tickets/${ticketId}/reject`, { reason }),

  closeTicketByAdmin: (ticketId: number) =>
    api.patch<ApiEnvelope<TicketResponse>>(`/admin/tickets/${ticketId}/close`),
}

export default ticketService
