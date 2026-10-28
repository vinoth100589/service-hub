import { api } from './api'
import type { AdminDashboard, ApiItemResponse, ApiListResponse, Provider } from '@/types'

export const adminService = {
  getDashboard: () =>
    api.get<ApiItemResponse<AdminDashboard>>('/admin/dashboard').then((r) => r.data),

  getPendingProviders: () =>
    api.get<ApiListResponse<Provider>>('/admin/providers/pending').then((r) => r.data),

  verifyProvider: (providerId: string) =>
    api.put<ApiItemResponse<Provider>>(`/admin/providers/${providerId}/verify`).then((r) => r.data),

  rejectProvider: (providerId: string) =>
    api.put<ApiItemResponse<Provider>>(`/admin/providers/${providerId}/reject`).then((r) => r.data),
}
