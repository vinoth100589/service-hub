import { api } from './api'
import type { ApiItemResponse, Notification } from '@/types'

export interface NotificationListResponse {
  data: Notification[]
  unread_count: number
}

export const notificationService = {
  list: (params: { limit?: number; offset?: number } = {}) =>
    api.get<NotificationListResponse>('/notifications', { params }).then((r) => r.data),

  markAsRead: (notificationId: string) =>
    api.put<ApiItemResponse<Notification>>(`/notifications/${notificationId}/read`).then((r) => r.data),

  markAllAsRead: () => api.put<{ message: string }>('/notifications/read-all').then((r) => r.data),
}
