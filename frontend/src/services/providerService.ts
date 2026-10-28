import { api } from './api'
import type { ApiItemResponse, Provider } from '@/types'

export interface ProviderApplyPayload {
  business_name: string
  business_description?: string
  service_categories: string[]
}

export const providerService = {
  apply: (payload: ProviderApplyPayload) =>
    api.post<ApiItemResponse<Provider>>('/providers/apply', payload).then((r) => r.data),

  getProfile: () => api.get<ApiItemResponse<Provider>>('/providers/profile').then((r) => r.data),

  updateSettings: (payload: Partial<ProviderApplyPayload> & { response_time_minutes?: number }) =>
    api.put<ApiItemResponse<Provider>>('/providers/settings', payload).then((r) => r.data),

  updateAvailability: (availability: Record<string, { start: string; end: string }>) =>
    api.put('/providers/availability', { availability }).then((r) => r.data),

  getPublicProfile: (providerId: string) =>
    api.get(`/services/provider/${providerId}/profile`).then((r) => r.data),
}
