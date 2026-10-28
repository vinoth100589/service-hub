import { api } from './api'
import type { AuthResponse, User } from '@/types'

export interface RegisterPayload {
  email: string
  password: string
  first_name: string
  last_name: string
}

export interface LoginPayload {
  email: string
  password: string
}

export const authService = {
  register: (payload: RegisterPayload) =>
    api.post<AuthResponse>('/auth/register', payload).then((r) => r.data),

  login: (payload: LoginPayload) =>
    api.post<AuthResponse>('/auth/login', payload).then((r) => r.data),

  getMe: () => api.get<{ user: User }>('/auth/me').then((r) => r.data),

  logout: () => api.post('/auth/logout').then((r) => r.data),
}
