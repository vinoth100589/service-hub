import { api } from './api'
import type { ApiItemResponse, ApiListResponse, Booking } from '@/types'

export interface CreateBookingPayload {
  service_id: string
  scheduled_date: string
  scheduled_duration_minutes?: number
  service_address: string
  notes?: string
}

export const bookingService = {
  list: (params: { limit?: number; offset?: number } = {}) =>
    api.get<ApiListResponse<Booking>>('/bookings', { params }).then((r) => r.data),

  getById: (bookingId: string) =>
    api.get<ApiItemResponse<Booking>>(`/bookings/${bookingId}`).then((r) => r.data),

  create: (payload: CreateBookingPayload) =>
    api.post<ApiItemResponse<Booking>>('/bookings', payload).then((r) => r.data),

  accept: (bookingId: string) =>
    api.put<ApiItemResponse<Booking>>(`/bookings/${bookingId}/accept`).then((r) => r.data),

  reject: (bookingId: string) =>
    api.put<ApiItemResponse<Booking>>(`/bookings/${bookingId}/reject`).then((r) => r.data),

  complete: (bookingId: string) =>
    api.put<ApiItemResponse<Booking>>(`/bookings/${bookingId}/complete`).then((r) => r.data),

  cancel: (bookingId: string) =>
    api.put<ApiItemResponse<Booking>>(`/bookings/${bookingId}/cancel`).then((r) => r.data),
}
