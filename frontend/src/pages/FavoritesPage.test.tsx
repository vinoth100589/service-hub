import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import FavoritesPage from './FavoritesPage'
import { favoriteService } from '@services/favoriteService'
import type { FavoriteProvider } from '@services/favoriteService'

vi.mock('@services/favoriteService', () => ({
  favoriteService: { list: vi.fn(), remove: vi.fn() },
}))

function favorite(overrides: Partial<FavoriteProvider> = {}): FavoriteProvider {
  return {
    favorite_id: 'fav-1',
    favorited_at: new Date().toISOString(),
    provider_id: 'provider-1',
    business_name: 'Sparkle Cleaners',
    average_rating: 4.9,
    total_reviews: 30,
    verification_status: 'verified',
    first_name: 'Sam',
    last_name: 'Smith',
    ...overrides,
  }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('FavoritesPage', () => {
  it('shows an empty state when there are no saved providers', async () => {
    (favoriteService.list as ReturnType<typeof vi.fn>).mockResolvedValue({ data: [] })

    render(<FavoritesPage />)

    expect(await screen.findByText('No saved providers yet')).toBeInTheDocument()
  })

  it('lists saved providers and removes one on click', async () => {
    (favoriteService.list as ReturnType<typeof vi.fn>).mockResolvedValue({ data: [favorite()] })
    ;(favoriteService.remove as ReturnType<typeof vi.fn>).mockResolvedValue({
      message: 'Provider removed from favorites',
    })

    render(<FavoritesPage />)

    expect(await screen.findByText('Sparkle Cleaners')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Remove' }))

    await waitFor(() => expect(favoriteService.remove).toHaveBeenCalledWith('provider-1'))
    await waitFor(() => expect(screen.queryByText('Sparkle Cleaners')).not.toBeInTheDocument())
    expect(screen.getByText('No saved providers yet')).toBeInTheDocument()
  })
})
