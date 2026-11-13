import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import AdminDashboardPage from './AdminDashboardPage'
import { adminService } from '@services/adminService'
import type { Dispute } from '@/types'

vi.mock('@services/adminService', () => ({
  adminService: {
    getDashboard: vi.fn(),
    getPendingProviders: vi.fn(),
    listDisputes: vi.fn(),
    verifyProvider: vi.fn(),
    rejectProvider: vi.fn(),
    resolveDispute: vi.fn(),
  },
}))

function dispute(overrides: Partial<Dispute> = {}): Dispute {
  return {
    id: 'dispute-1',
    booking_id: 'booking-1',
    initiated_by: 'customer-1',
    status: 'open',
    title: 'Late arrival',
    description: 'Provider arrived 2 hours late',
    created_at: new Date().toISOString(),
    first_name: 'Jane',
    last_name: 'Doe',
    ...overrides,
  }
}

const emptyDashboard = {
  total_customers: 0,
  verified_providers: 0,
  completed_bookings: 0,
  total_revenue: 0,
}

beforeEach(() => {
  vi.clearAllMocks()
  ;(adminService.getDashboard as ReturnType<typeof vi.fn>).mockResolvedValue({ data: emptyDashboard })
  ;(adminService.getPendingProviders as ReturnType<typeof vi.fn>).mockResolvedValue({ data: [] })
})

// Regression coverage for a previously missing feature: the backend has
// had full dispute listing/resolution (AdminController.listDisputes /
// resolveDispute) with no admin UI consumer at all.
describe('AdminDashboardPage open disputes', () => {
  it('shows an empty state when there are no open disputes', async () => {
    (adminService.listDisputes as ReturnType<typeof vi.fn>).mockResolvedValue({ data: [] })

    render(<AdminDashboardPage />)

    expect(await screen.findByText('No open disputes')).toBeInTheDocument()
  })

  it('lists an open dispute and resolves it with a resolution and refund amount', async () => {
    (adminService.listDisputes as ReturnType<typeof vi.fn>).mockResolvedValue({ data: [dispute()] })
    ;(adminService.resolveDispute as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: dispute({ status: 'resolved' }),
    })

    render(<AdminDashboardPage />)

    expect(await screen.findByText('Late arrival')).toBeInTheDocument()
    expect(screen.getByText('Filed by Jane Doe')).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('Resolution'), {
      target: { value: 'Refund issued to customer' },
    })
    fireEvent.change(screen.getByLabelText('Refund amount (optional)'), { target: { value: '25' } })
    fireEvent.click(screen.getByRole('button', { name: 'Resolve dispute' }))

    await waitFor(() =>
      expect(adminService.resolveDispute).toHaveBeenCalledWith('dispute-1', {
        resolution: 'Refund issued to customer',
        refund_amount: 25,
      }),
    )
  })

  it('requires a resolution before submitting', async () => {
    (adminService.listDisputes as ReturnType<typeof vi.fn>).mockResolvedValue({ data: [dispute()] })

    render(<AdminDashboardPage />)

    fireEvent.click(await screen.findByRole('button', { name: 'Resolve dispute' }))

    expect(adminService.resolveDispute).not.toHaveBeenCalled()
  })
})
