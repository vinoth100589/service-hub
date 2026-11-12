import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import LoadingSpinner from '@components/common/LoadingSpinner'
import EmptyState from '@components/common/EmptyState'
import RatingStars from '@components/common/RatingStars'
import { favoriteService } from '@services/favoriteService'
import type { FavoriteProvider } from '@services/favoriteService'

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<FavoriteProvider[]>([])
  const [loading, setLoading] = useState(true)
  const [removingId, setRemovingId] = useState<string | null>(null)

  const load = () => {
    setLoading(true)
    favoriteService
      .list()
      .then((res) => setFavorites(res.data))
      .catch((err: Error) => toast.error(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const handleRemove = async (providerId: string) => {
    setRemovingId(providerId)
    try {
      await favoriteService.remove(providerId)
      setFavorites((prev) => prev.filter((f) => f.provider_id !== providerId))
      toast.success('Removed from saved providers')
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setRemovingId(null)
    }
  }

  if (loading) return <LoadingSpinner label="Loading saved providers…" />

  return (
    <div>
      <h1 className="mb-6 text-xl font-semibold text-gray-900">Saved providers</h1>

      {favorites.length === 0 ? (
        <EmptyState
          title="No saved providers yet"
          description="Save a provider from their service page to find them here later."
        />
      ) : (
        <ul className="flex flex-col gap-4">
          {favorites.map((favorite) => (
            <li
              key={favorite.favorite_id}
              className="card flex items-center justify-between gap-4 p-4"
            >
              <div>
                <p className="text-sm font-medium text-gray-900">{favorite.business_name}</p>
                <RatingStars rating={favorite.average_rating} reviewCount={favorite.total_reviews} />
              </div>
              <button
                className="btn-secondary"
                disabled={removingId === favorite.provider_id}
                onClick={() => handleRemove(favorite.provider_id)}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
