import { api } from './api'
import type { ApiItemResponse, ApiListResponse, Payment } from '@/types'

export const paymentService = {
  list: (params: { limit?: number; offset?: number } = {}) =>
    api.get<ApiListResponse<Payment>>('/payments', { params }).then((r) => r.data),

  getById: (paymentId: string) =>
    api.get<ApiItemResponse<Payment>>(`/payments/${paymentId}`).then((r) => r.data),

  createIntent: (payload: { booking_id: string; amount: number }) =>
    api
      .post<ApiItemResponse<{ id: string; amount: number; client_secret: string }>>(
        '/payments/intent',
        payload
      )
      .then((r) => r.data),

  confirm: (payload: { payment_id: string; stripe_charge_id: string }) =>
    api.post<ApiItemResponse<Payment>>('/payments/confirm', payload).then((r) => r.data),

  refund: (paymentId: string) =>
    api.post<ApiItemResponse<Payment>>(`/payments/${paymentId}/refund`).then((r) => r.data),

  getPayouts: () =>
    api
      .get<ApiListResponse<Payment> & { total_earnings: number }>('/payments/provider/payouts')
      .then((r) => r.data),
}
