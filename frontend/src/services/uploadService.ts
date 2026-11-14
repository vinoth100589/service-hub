import { api } from './api'
import type { ApiItemResponse } from '@/types'

export const uploadService = {
  uploadAvatar: (file: File) => {
    const formData = new FormData()
    formData.append('image', file)
    return api
      .post<ApiItemResponse<{ avatar_url: string }>>('/uploads/avatar', formData)
      .then((r) => r.data)
  },
}
