import { api } from './api'
import type { ApiItemResponse, ApiListResponse } from '@/types'

export interface FavoriteProvider {
  favorite_id: string
  favorited_at: string
  provider_id: string
  business_name: string
  average_rating: number
  total_reviews: number
  verification_status: string
  service_categories?: string[]
  first_name: string
  last_name: string
  avatar_url?: string
}

export const favoriteService = {
  list: () => api.get<ApiListResponse<FavoriteProvider>>('/favorites').then((r) => r.data),

  add: (providerId: string) =>
    api
      .post<ApiItemResponse<{ id: string; provider_id: string }>>('/favorites', { provider_id: providerId })
      .then((r) => r.data),

  remove: (providerId: string) => api.delete(`/favorites/${providerId}`).then((r) => r.data),
}
