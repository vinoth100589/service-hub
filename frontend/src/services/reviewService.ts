import { api } from './api'
import type { ApiItemResponse, ApiListResponse, Review } from '@/types'

export interface CreateReviewPayload {
  booking_id: string
  rating: number
  title: string
  content: string
  cleanliness_rating?: number
  professionalism_rating?: number
  punctuality_rating?: number
}

export const reviewService = {
  list: () => api.get<ApiListResponse<Review>>('/reviews').then((r) => r.data),

  listByProvider: (providerId: string, params: { limit?: number; offset?: number } = {}) =>
    api
      .get<ApiListResponse<Review>>(`/reviews/provider/${providerId}`, { params })
      .then((r) => r.data),

  getById: (reviewId: string) =>
    api.get<ApiItemResponse<Review>>(`/reviews/${reviewId}`).then((r) => r.data),

  create: (payload: CreateReviewPayload) =>
    api.post<ApiItemResponse<Review>>('/reviews', payload).then((r) => r.data),

  update: (reviewId: string, payload: Partial<CreateReviewPayload>) =>
    api.put<ApiItemResponse<Review>>(`/reviews/${reviewId}`, payload).then((r) => r.data),

  remove: (reviewId: string) => api.delete(`/reviews/${reviewId}`).then((r) => r.data),
}
