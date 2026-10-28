import { api } from './api'
import type { ApiItemResponse, ApiListResponse, Conversation, Message } from '@/types'

export interface SendMessagePayload {
  booking_id: string
  receiver_id: string
  content: string
  file_url?: string
}

export const messageService = {
  listAll: () => api.get<ApiListResponse<Message>>('/messages').then((r) => r.data),

  getConversations: () =>
    api.get<ApiListResponse<Conversation>>('/messages/conversations').then((r) => r.data),

  getByBooking: (bookingId: string, params: { limit?: number; offset?: number } = {}) =>
    api.get<ApiListResponse<Message>>(`/messages/${bookingId}`, { params }).then((r) => r.data),

  send: (payload: SendMessagePayload) =>
    api.post<ApiItemResponse<Message>>('/messages', payload).then((r) => r.data),

  markRead: (messageId: string) =>
    api.put<ApiItemResponse<Message>>(`/messages/${messageId}/read`).then((r) => r.data),

  remove: (messageId: string) => api.delete(`/messages/${messageId}`).then((r) => r.data),
}
