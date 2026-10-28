import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import RatingStars from '@components/common/RatingStars'
import LoadingSpinner from '@components/common/LoadingSpinner'
import { serviceService } from '@services/serviceService'
import { bookingService } from '@services/bookingService'
import { useAuthStore } from '@store/authStore'
import type { Review, Service } from '@/types'

export default function ServiceDetailPage() {
  const { serviceId } = useParams<{ serviceId: string }>()
  const navigate = useNavigate()
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  const [service, setService] = useState<Service | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)

  const [bookingForm, setBookingForm] = useState({
    scheduled_date: '',
    service_address: '',
    notes: '',
  })
  const [booking, setBooking] = useState(false)

  useEffect(() => {
    if (!serviceId) return
    setLoading(true)
    serviceService
      .getById(serviceId)
      .then((res) => {
        setService(res.data)
        setReviews((res.recent_reviews as Review[] | undefined) ?? [])
      })
      .catch((err: Error) => toast.error(err.message))
      .finally(() => setLoading(false))
  }, [serviceId])

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/services/${serviceId}` } })
      return
    }
    if (!serviceId) return

    setBooking(true)
    try {
      await bookingService.create({
        service_id: serviceId,
        scheduled_date: new Date(bookingForm.scheduled_date).toISOString(),
        scheduled_duration_minutes: service?.duration_minutes ?? 60,
        service_address: bookingForm.service_address,
        notes: bookingForm.notes || undefined,
      })
      toast.success('Booking request sent!')
      navigate('/bookings')
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setBooking(false)
    }
  }

  if (loading) return <LoadingSpinner label="Loading service…" />
  if (!service) return <p className="text-gray-600">Service not found.</p>

  const priceLabel =
    service.price_unit === 'hourly' ? `$${service.base_price}/hr` : `$${service.base_price}`

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
      <div className="flex flex-col gap-6">
        <div className="card p-6">
          <p className="text-xs font-medium uppercase tracking-wide text-primary-600">
            {service.category}
          </p>
          <h1 className="mt-1 text-2xl font-bold text-gray-900">{service.name}</h1>
          <div className="mt-2">
            <RatingStars rating={service.rating} reviewCount={service.review_count} />
          </div>
          <p className="mt-4 text-gray-700">{service.description}</p>
          <p className="mt-4 text-lg font-semibold text-primary-700">{priceLabel}</p>

          {service.provider && (
            <div className="mt-6 border-t border-gray-100 pt-4">
              <p className="text-sm font-medium text-gray-900">
                Provided by {service.provider.business_name}
              </p>
              <RatingStars
                rating={service.provider.average_rating}
                reviewCount={service.provider.total_reviews}
              />
              <p className="mt-1 text-xs text-gray-500">
                {service.provider.total_bookings} completed bookings ·{' '}
                {service.provider.verification_status}
              </p>
            </div>
          )}
        </div>

        <div className="card p-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Reviews</h2>
          {reviews.length === 0 ? (
            <p className="text-sm text-gray-500">No reviews yet.</p>
          ) : (
            <ul className="flex flex-col gap-4">
              {reviews.map((review) => (
                <li key={review.id} className="border-b border-gray-100 pb-4 last:border-0">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-gray-900">{review.title}</p>
                    <RatingStars rating={review.rating} showValue={false} />
                  </div>
                  <p className="mt-1 text-sm text-gray-600">{review.content}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <aside className="card h-fit p-6">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Request this service</h2>
        <form className="flex flex-col gap-4" onSubmit={handleBooking}>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">
              Preferred date & time
            </label>
            <input
              required
              type="datetime-local"
              className="input"
              value={bookingForm.scheduled_date}
              onChange={(e) =>
                setBookingForm({ ...bookingForm, scheduled_date: e.target.value })
              }
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">
              Service address
            </label>
            <input
              required
              className="input"
              placeholder="123 Main St, New York, NY"
              value={bookingForm.service_address}
              onChange={(e) =>
                setBookingForm({ ...bookingForm, service_address: e.target.value })
              }
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">
              Notes (optional)
            </label>
            <textarea
              className="input"
              rows={3}
              value={bookingForm.notes}
              onChange={(e) => setBookingForm({ ...bookingForm, notes: e.target.value })}
            />
          </div>

          <button type="submit" className="btn-primary" disabled={booking}>
            {booking ? 'Booking…' : 'Request booking'}
          </button>
        </form>
      </aside>
    </div>
  )
}
