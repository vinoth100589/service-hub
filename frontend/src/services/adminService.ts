import { api } from './api'
import type { AdminDashboard, ApiItemResponse, ApiListResponse, Dispute, Provider } from '@/types'

export interface ResolveDisputePayload {
  resolution: string
  refund_amount?: number
}

export const adminService = {
  getDashboard: () =>
    api.get<ApiItemResponse<AdminDashboard>>('/admin/dashboard').then((r) => r.data),

  getPendingProviders: () =>
    api.get<ApiListResponse<Provider>>('/admin/providers/pending').then((r) => r.data),

  verifyProvider: (providerId: string) =>
    api.put<ApiItemResponse<Provider>>(`/admin/providers/${providerId}/verify`).then((r) => r.data),

  rejectProvider: (providerId: string) =>
    api.put<ApiItemResponse<Provider>>(`/admin/providers/${providerId}/reject`).then((r) => r.data),

  listDisputes: () => api.get<ApiListResponse<Dispute>>('/admin/disputes').then((r) => r.data),

  resolveDispute: (disputeId: string, payload: ResolveDisputePayload) =>
    api
      .put<ApiItemResponse<Dispute>>(`/admin/disputes/${disputeId}/resolve`, payload)
      .then((r) => r.data),
}
