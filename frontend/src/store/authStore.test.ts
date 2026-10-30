import { describe, it, expect, beforeEach } from 'vitest'
import { useAuthStore } from './authStore'
import type { User } from '@/types'

const user: User = {
  id: 'user-1',
  email: 'jane@example.com',
  first_name: 'Jane',
  last_name: 'Doe',
  user_type: 'customer',
}

beforeEach(() => {
  useAuthStore.setState({ user: null, token: null, isAuthenticated: false })
})

describe('useAuthStore', () => {
  it('starts logged out', () => {
    const state = useAuthStore.getState()
    expect(state.user).toBeNull()
    expect(state.token).toBeNull()
    expect(state.isAuthenticated).toBe(false)
  })

  it('login stores the user, token, and marks authenticated', () => {
    useAuthStore.getState().login(user, 'access-token-1')

    const state = useAuthStore.getState()
    expect(state.user).toEqual(user)
    expect(state.token).toBe('access-token-1')
    expect(state.isAuthenticated).toBe(true)
  })

  it('logout clears the user, token, and authenticated flag', () => {
    useAuthStore.getState().login(user, 'access-token-1')
    useAuthStore.getState().logout()

    const state = useAuthStore.getState()
    expect(state.user).toBeNull()
    expect(state.token).toBeNull()
    expect(state.isAuthenticated).toBe(false)
  })

  it('setUser updates the user without touching the token or auth flag', () => {
    useAuthStore.getState().login(user, 'access-token-1')

    const updated: User = { ...user, first_name: 'Janet' }
    useAuthStore.getState().setUser(updated)

    const state = useAuthStore.getState()
    expect(state.user).toEqual(updated)
    expect(state.token).toBe('access-token-1')
    expect(state.isAuthenticated).toBe(true)
  })
})
