import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import ServiceDetailPage from './ServiceDetailPage'
import { serviceService } from '@services/serviceService'
import { favoriteService } from '@services/favoriteService'
import { useAuthStore } from '@store/authStore'
import type { ApiItemResponse, Service, User } from '@/types'

vi.mock('@services/serviceService', () => ({
  serviceService: { getById: vi.fn() },
}))

vi.mock('@services/bookingService', () => ({
  bookingService: { create: vi.fn() },
}))

vi.mock('@services/favoriteService', () => ({
  favoriteService: { list: vi.fn(), add: vi.fn(), remove: vi.fn() },
}))

const customer: User = {
  id: 'customer-1',
  email: 'jane@example.com',
  first_name: 'Jane',
  last_name: 'Doe',
  user_type: 'customer',
}

function serviceResponse(): ApiItemResponse<Service> {
  return {
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
}

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
  useAuthStore.setState({ user: null, token: null, isAuthenticated: false })
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

// Regression coverage for the previously entirely-unused favorites feature:
// the backend has had a full /favorites API (list/add/remove) with no
// frontend consumer at all. This covers the new save/unsave toggle on the
// service detail page.
describe('ServiceDetailPage save provider toggle', () => {
  it('does not show the save button for an unauthenticated visitor', async () => {
    (serviceService.getById as ReturnType<typeof vi.fn>).mockResolvedValue(serviceResponse())

    renderAt('service-1')

    await screen.findByText('Provided by Sparkle Cleaners')
    expect(screen.queryByRole('button', { name: /save provider|saved/i })).not.toBeInTheDocument()
    expect(favoriteService.list).not.toHaveBeenCalled()
  })

  it('shows "Save provider" when the provider is not yet favorited, and saves it on click', async () => {
    useAuthStore.setState({ user: customer, token: 't', isAuthenticated: true })
    ;(serviceService.getById as ReturnType<typeof vi.fn>).mockResolvedValue(serviceResponse())
    ;(favoriteService.list as ReturnType<typeof vi.fn>).mockResolvedValue({ data: [] })
    ;(favoriteService.add as ReturnType<typeof vi.fn>).mockResolvedValue({ data: { id: 'fav-1', provider_id: 'provider-1' } })

    renderAt('service-1')

    const button = await screen.findByRole('button', { name: 'Save provider' })
    fireEvent.click(button)

    await waitFor(() => expect(favoriteService.add).toHaveBeenCalledWith('provider-1'))
    expect(await screen.findByRole('button', { name: 'Saved' })).toBeInTheDocument()
  })

  it('shows "Saved" when the provider is already favorited, and unsaves it on click', async () => {
    useAuthStore.setState({ user: customer, token: 't', isAuthenticated: true })
    ;(serviceService.getById as ReturnType<typeof vi.fn>).mockResolvedValue(serviceResponse())
    ;(favoriteService.list as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: [{ favorite_id: 'fav-1', favorited_at: new Date().toISOString(), provider_id: 'provider-1', business_name: 'Sparkle Cleaners', average_rating: 4.9, total_reviews: 30, verification_status: 'verified', first_name: 'Sam', last_name: 'Smith' }],
    })
    ;(favoriteService.remove as ReturnType<typeof vi.fn>).mockResolvedValue({ message: 'Provider removed from favorites' })

    renderAt('service-1')

    const button = await screen.findByRole('button', { name: 'Saved' })
    fireEvent.click(button)

    await waitFor(() => expect(favoriteService.remove).toHaveBeenCalledWith('provider-1'))
    expect(await screen.findByRole('button', { name: 'Save provider' })).toBeInTheDocument()
  })
})
