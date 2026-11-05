import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import ServiceDetailPage from './ServiceDetailPage'
import { serviceService } from '@services/serviceService'
import type { ApiItemResponse, Service } from '@/types'

vi.mock('@services/serviceService', () => ({
  serviceService: { getById: vi.fn() },
}))

vi.mock('@services/bookingService', () => ({
  bookingService: { create: vi.fn() },
}))

function renderAt(serviceId: string) {
  return render(
    <MemoryRouter initialEntries={[`/services/${serviceId}`]}>
      <Routes>
        <Route path="/services/:serviceId" element={<ServiceDetailPage />} />
      </Routes>
    </MemoryRouter>
  )
}

beforeEach(() => {
  vi.clearAllMocks()
})

// Regression coverage for two contract-mismatch bugs: the backend's
// getServiceById (ServiceController) returns provider fields flat on
// `data` (never nested under `data.provider`), and nests `recent_reviews`
// inside `data` rather than as a sibling of it — both previously left this
// page's provider block and reviews list permanently empty.
describe('ServiceDetailPage provider info and reviews', () => {
  it('renders the provider block from the flat fields the backend returns', async () => {
    const response: ApiItemResponse<Service> = {
      data: {
        id: 'service-1',
        provider_id: 'provider-1',
        name: 'Deep clean',
        description: 'A thorough home clean',
        category: 'Cleaning',
        base_price: 80,
        price_unit: 'flat_rate',
        rating: 4.8,
        review_count: 12,
        images: [],
        created_at: new Date().toISOString(),
        business_name: 'Sparkle Cleaners',
        average_rating: 4.9,
        total_reviews: 30,
        total_bookings: 42,
        verification_status: 'verified',
        recent_reviews: [],
      },
    }
    ;(serviceService.getById as ReturnType<typeof vi.fn>).mockResolvedValue(response)

    renderAt('service-1')

    expect(await screen.findByText('Provided by Sparkle Cleaners')).toBeInTheDocument()
    expect(screen.getByText(/42 completed bookings/)).toBeInTheDocument()
    expect(screen.getByText(/verified/)).toBeInTheDocument()
  })

  it('renders reviews nested under data.recent_reviews', async () => {
    const response: ApiItemResponse<Service> = {
      data: {
        id: 'service-1',
        provider_id: 'provider-1',
        name: 'Deep clean',
        description: 'A thorough home clean',
        category: 'Cleaning',
        base_price: 80,
        price_unit: 'flat_rate',
        rating: 4.8,
        review_count: 12,
        images: [],
        created_at: new Date().toISOString(),
        recent_reviews: [
          {
            id: 'review-1',
            booking_id: 'booking-1',
            reviewer_id: 'user-1',
            reviewee_id: 'provider-1',
            rating: 5,
            title: 'Great job',
            content: 'Very thorough and on time.',
            created_at: new Date().toISOString(),
          },
        ],
      },
    }
    ;(serviceService.getById as ReturnType<typeof vi.fn>).mockResolvedValue(response)

    renderAt('service-1')

    expect(await screen.findByText('Great job')).toBeInTheDocument()
    expect(screen.queryByText('No reviews yet.')).not.toBeInTheDocument()
  })
})
