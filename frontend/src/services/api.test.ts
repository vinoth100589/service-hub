import { describe, it, expect, beforeEach, vi } from 'vitest'
import type { InternalAxiosRequestConfig, AxiosError } from 'axios'
import { api } from './api'
import { AUTH_STORAGE_KEY } from '@config/constants'

// axios doesn't expose a clean public API for reaching into a configured
// instance's registered interceptors, so tests invoke the handlers directly
// off the internal `handlers` array — the standard way to unit-test them
// without making a real HTTP call.
interface InterceptorManagerInternals<T> {
  handlers: Array<{ fulfilled?: (value: T) => T; rejected?: (error: unknown) => unknown }>
}

const requestInterceptor = (
  api.interceptors.request as unknown as InterceptorManagerInternals<InternalAxiosRequestConfig>
).handlers[0].fulfilled as (config: InternalAxiosRequestConfig) => InternalAxiosRequestConfig

const responseRejected = (
  api.interceptors.response as unknown as InterceptorManagerInternals<unknown>
).handlers[0].rejected as (error: AxiosError) => Promise<never>

function emptyConfig(): InternalAxiosRequestConfig {
  return { headers: {} } as InternalAxiosRequestConfig
}

function axiosErrorWithStatus(status: number, data?: Record<string, unknown>): AxiosError {
  return {
    isAxiosError: true,
    message: 'Request failed',
    response: { status, data, statusText: '', headers: {}, config: emptyConfig() },
  } as unknown as AxiosError
}

beforeEach(() => {
  localStorage.clear()
  window.history.pushState({}, '', '/')
})

// jsdom's window.location.assign isn't configurable, so spyOn can't patch it
// directly — replace the whole location object with a minimal stub exposing
// just what the interceptor reads (pathname) and calls (assign).
function stubLocationAssign(pathname: string) {
  const assign = vi.fn()
  const original = window.location
  Object.defineProperty(window, 'location', {
    value: { pathname, assign },
    configurable: true,
  })
  return { assign, restore: () => Object.defineProperty(window, 'location', { value: original, configurable: true }) }
}

describe('api request interceptor', () => {
  it('attaches the stored token as a Bearer header', () => {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ state: { token: 'abc123' } }))

    const config = requestInterceptor(emptyConfig())

    expect(config.headers.Authorization).toBe('Bearer abc123')
  })

  it('does not set an Authorization header when there is no stored token', () => {
    const config = requestInterceptor(emptyConfig())

    expect(config.headers.Authorization).toBeUndefined()
  })

  it('does not throw and skips the header when localStorage holds malformed JSON', () => {
    localStorage.setItem(AUTH_STORAGE_KEY, '{not valid json')

    const config = requestInterceptor(emptyConfig())

    expect(config.headers.Authorization).toBeUndefined()
  })
})

describe('api response interceptor', () => {
  it('clears stored auth and redirects to /login on a 401', async () => {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ state: { token: 'abc123' } }))
    const location = stubLocationAssign('/dashboard')

    await expect(responseRejected(axiosErrorWithStatus(401))).rejects.toThrow()

    expect(localStorage.getItem(AUTH_STORAGE_KEY)).toBeNull()
    expect(location.assign).toHaveBeenCalledWith('/login')
    location.restore()
  })

  it('does not redirect again if already on the login page', async () => {
    const location = stubLocationAssign('/login')

    await expect(responseRejected(axiosErrorWithStatus(401))).rejects.toThrow()

    expect(location.assign).not.toHaveBeenCalled()
    location.restore()
  })

  it('prefers the server-provided error message over the generic axios message', async () => {
    await expect(
      responseRejected(axiosErrorWithStatus(400, { error: 'Validation failed' })),
    ).rejects.toThrow('Validation failed')
  })

  it('falls back to data.message when there is no data.error', async () => {
    await expect(
      responseRejected(axiosErrorWithStatus(500, { message: 'Internal failure' })),
    ).rejects.toThrow('Internal failure')
  })

  it('falls back to a generic message when the server sends no error details', async () => {
    const error = { isAxiosError: true, message: 'Network Error' } as AxiosError
    await expect(responseRejected(error)).rejects.toThrow('Network Error')
  })
})
