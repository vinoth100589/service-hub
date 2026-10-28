import { api } from './api'
import type { ApiItemResponse, ApiListResponse, Service } from '@/types'

export interface ServiceSearchParams {
  q?: string
  category?: string
  minPrice?: number
  maxPrice?: number
  minRating?: number
  latitude?: number
  longitude?: number
  radiusKm?: number
  sortBy?: string
  limit?: number
  offset?: number
}

export interface ServiceCreatePayload {
  name: string
  description: string
  category: string
  subcategory?: string
  base_price: number
  price_unit?: string
  duration_minutes?: number
  coverage_radius_km?: number
  images?: string[]
}

export const serviceService = {
  list: (params: ServiceSearchParams = {}) =>
    api.get<ApiListResponse<Service>>('/services', { params }).then((r) => r.data),

  nearby: (params: ServiceSearchParams) =>
    api.get<ApiListResponse<Service>>('/services/nearby', { params }).then((r) => r.data),

  featured: (limit = 10) =>
    api
      .get<ApiListResponse<Service>>('/services/featured', { params: { limit } })
      .then((r) => r.data),

  getCategories: () =>
    api.get<ApiListResponse<string> & { data: string[] }>('/services/categories').then((r) => r.data),

  getById: (serviceId: string) =>
    api
      .get<ApiItemResponse<Service> & { recent_reviews?: unknown[] }>(`/services/${serviceId}`)
      .then((r) => r.data),

  getProviderProfile: (providerId: string) =>
    api.get(`/services/provider/${providerId}/profile`).then((r) => r.data),

  create: (payload: ServiceCreatePayload) =>
    api.post<ApiItemResponse<Service>>('/services', payload).then((r) => r.data),

  update: (serviceId: string, payload: Partial<ServiceCreatePayload>) =>
    api.put<ApiItemResponse<Service>>(`/services/${serviceId}`, payload).then((r) => r.data),

  remove: (serviceId: string) => api.delete(`/services/${serviceId}`).then((r) => r.data),
}
