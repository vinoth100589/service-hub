import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import BookingsPage from './BookingsPage'
import { bookingService } from '@services/bookingService'
import { useAuthStore } from '@store/authStore'
import type { Booking, User } from '@/types'

vi.mock('@services/bookingService', () => ({
  bookingService: {
    list: vi.fn(),
    accept: vi.fn(),
    reject: vi.fn(),
    complete: vi.fn(),
    cancel: vi.fn(),
  },
}))

const customer: User = {
  id: 'customer-1',
  email: 'jane@example.com',
  first_name: 'Jane',
  last_name: 'Doe',
  user_type: 'customer',
}

const provider: User = { ...customer, id: 'provider-1', user_type: 'provider' }

// A freshly-created booking — this is the exact status the backend actually
// sets (bookingController.createBooking inserts status = 'requested'), not
// the stale 'pending' the UI used to check against.
function requestedBooking(): Booking {
  return {
    id: 'booking-123456789',
    user_id: 'customer-1',
    provider_id: 'provider-record-1',
    service_id: 'service-1',
    status: 'requested',
    scheduled_date: new Date().toISOString(),
    service_address: '123 Main St',
    created_at: new Date().toISOString(),
  }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('BookingsPage status handling', () => {
  it('shows Accept/Reject to the provider for a newly requested booking', async () => {
    useAuthStore.setState({ user: provider, token: 't', isAuthenticated: true })
    ;(bookingService.list as ReturnType<typeof vi.fn>).mockResolvedValue({ data: [requestedBooking()] })

    render(<BookingsPage />)

    expect(await screen.findByRole('button', { name: 'Accept' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Reject' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Mark complete' })).not.toBeInTheDocument()
  })

  it('shows Cancel to the customer for a newly requested booking', async () => {
    useAuthStore.setState({ user: customer, token: 't', isAuthenticated: true })
    ;(bookingService.list as ReturnType<typeof vi.fn>).mockResolvedValue({ data: [requestedBooking()] })

    render(<BookingsPage />)

    expect(await screen.findByRole('button', { name: 'Cancel' })).toBeInTheDocument()
  })

  it('renders a real status badge instead of "badge undefined" for a requested booking', async () => {
    useAuthStore.setState({ user: customer, token: 't', isAuthenticated: true })
    ;(bookingService.list as ReturnType<typeof vi.fn>).mockResolvedValue({ data: [requestedBooking()] })

    render(<BookingsPage />)

    const badge = await screen.findByText('requested')
    expect(badge.className).not.toContain('undefined')
  })

  it('shows Mark complete to the provider once a booking is accepted', async () => {
    useAuthStore.setState({ user: provider, token: 't', isAuthenticated: true })
    ;(bookingService.list as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: [{ ...requestedBooking(), status: 'accepted' }],
    })

    render(<BookingsPage />)

    expect(await screen.findByRole('button', { name: 'Mark complete' })).toBeInTheDocument()
  })
})
