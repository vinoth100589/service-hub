import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import toast from 'react-hot-toast'
import ProfilePage from './ProfilePage'
import { paymentService } from '@services/paymentService'
import { providerService } from '@services/providerService'
import { useAuthStore } from '@store/authStore'
import type { User } from '@/types'

vi.mock('@services/paymentService', () => ({
  paymentService: { list: vi.fn() },
}))

vi.mock('@services/providerService', () => ({
  providerService: { apply: vi.fn() },
}))

vi.mock('react-hot-toast', () => ({
  default: { success: vi.fn(), error: vi.fn() },
}))

const customer: User = {
  id: 'customer-1',
  email: 'jane@example.com',
  first_name: 'Jane',
  last_name: 'Doe',
  user_type: 'customer',
}

beforeEach(() => {
  vi.clearAllMocks()
  useAuthStore.setState({ user: customer, token: 't', isAuthenticated: true })
  ;(paymentService.list as ReturnType<typeof vi.fn>).mockResolvedValue({ data: [] })
})

// Regression coverage: applying as a provider changes user_type on the
// backend immediately, but the session's JWT/local user still says
// 'customer' until a fresh login — the page used to show a generic
// hardcoded toast and leave the form up to be resubmitted (and rejected)
// instead of surfacing the backend's own "log in again" guidance.
describe('ProfilePage become a provider', () => {
  it('shows the backend\'s own message and hides the form after a successful application', async () => {
    (providerService.apply as ReturnType<typeof vi.fn>).mockResolvedValue({
      message: 'Provider application submitted successfully. Log in again to access provider features.',
      data: { id: 'provider-1' },
    })

    render(<ProfilePage />)

    const businessNameInput = await screen.findByLabelText('Business name')
    fireEvent.change(businessNameInput, { target: { value: 'Sparkle Cleaners' } })
    fireEvent.click(screen.getByRole('button', { name: 'Apply as provider' }))

    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith(
        'Provider application submitted successfully. Log in again to access provider features.',
      ),
    )
    expect(
      await screen.findByText('Application submitted. Log out and log back in to access provider features.'),
    ).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Apply as provider' })).not.toBeInTheDocument()
  })
})
