import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import ServiceCard from './ServiceCard'
import type { Service } from '@/types'

// The backend never nests provider fields under a `service.provider` object
// (ServiceService.listServices selects them flat on the same row) — this
// guards against that assumption creeping back in and silently hiding the
// "by <business name>" line on every card.
function service(overrides: Partial<Service> = {}): Service {
  return {
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
    ...overrides,
  }
}

describe('ServiceCard', () => {
  it('renders the provider business name from the flat field the backend actually returns', () => {
    render(
      <MemoryRouter>
        <ServiceCard service={service({ business_name: 'Sparkle Cleaners' })} />
      </MemoryRouter>
    )

    expect(screen.getByText('by Sparkle Cleaners')).toBeInTheDocument()
  })

  it('omits the "by" line when no business name is present', () => {
    render(
      <MemoryRouter>
        <ServiceCard service={service()} />
      </MemoryRouter>
    )

    expect(screen.queryByText(/^by /)).not.toBeInTheDocument()
  })
})
