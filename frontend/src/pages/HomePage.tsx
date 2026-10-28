import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import ServiceCard from '@components/services/ServiceCard'
import ServiceFilters, { type ServiceFilterValues } from '@components/services/ServiceFilters'
import LoadingSpinner from '@components/common/LoadingSpinner'
import EmptyState from '@components/common/EmptyState'
import { serviceService } from '@services/serviceService'
import type { Pagination, Service } from '@/types'

const DEFAULT_FILTERS: ServiceFilterValues = {
  q: '',
  category: '',
  minPrice: '',
  maxPrice: '',
  minRating: '',
  sortBy: 'newest',
}

const PAGE_SIZE = 12

export default function HomePage() {
  const [filters, setFilters] = useState<ServiceFilterValues>(DEFAULT_FILTERS)
  const [services, setServices] = useState<Service[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)

    serviceService
      .list({
        q: filters.q || undefined,
        category: filters.category || undefined,
        minPrice: filters.minPrice ? Number(filters.minPrice) : undefined,
        maxPrice: filters.maxPrice ? Number(filters.maxPrice) : undefined,
        minRating: filters.minRating ? Number(filters.minRating) : undefined,
        sortBy: filters.sortBy,
        limit: PAGE_SIZE,
        offset: page * PAGE_SIZE,
      })
      .then((res) => {
        if (cancelled) return
        setServices(res.data)
        setPagination(res.pagination ?? null)
      })
      .catch((err: Error) => {
        if (!cancelled) toast.error(err.message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [filters, page])

  const handleFiltersChange = (next: ServiceFilterValues) => {
    setPage(0)
    setFilters(next)
  }

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-[260px_1fr]">
      <aside className="md:sticky md:top-20 md:self-start">
        <ServiceFilters values={filters} onChange={handleFiltersChange} />
      </aside>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-900">Find local service providers</h1>
          {pagination && (
            <p className="text-sm text-gray-500">{pagination.total} services found</p>
          )}
        </div>

        {loading ? (
          <LoadingSpinner label="Loading services…" />
        ) : services.length === 0 ? (
          <EmptyState
            title="No services match your filters"
            description="Try adjusting your search or clearing filters."
          />
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {services.map((service) => (
                <ServiceCard key={service.id} service={service} />
              ))}
            </div>

            {pagination && pagination.pages > 1 && (
              <div className="mt-6 flex items-center justify-center gap-2">
                <button
                  className="btn-secondary"
                  disabled={page === 0}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                >
                  Previous
                </button>
                <span className="text-sm text-gray-600">
                  Page {page + 1} of {pagination.pages}
                </span>
                <button
                  className="btn-secondary"
                  disabled={page + 1 >= pagination.pages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  )
}
