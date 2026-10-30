import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import LoadingSpinner from '@components/common/LoadingSpinner'
import EmptyState from '@components/common/EmptyState'
import { bookingService } from '@services/bookingService'
import { useAuthStore } from '@store/authStore'
import type { Booking, BookingStatus } from '@/types'

const STATUS_STYLES: Record<BookingStatus, string> = {
  requested: 'bg-amber-50 text-amber-700',
  accepted: 'bg-blue-50 text-blue-700',
  in_progress: 'bg-indigo-50 text-indigo-700',
  completed: 'bg-green-50 text-green-700',
  rejected: 'bg-red-50 text-red-700',
  cancelled: 'bg-gray-100 text-gray-600',
}

export default function BookingsPage() {
  const user = useAuthStore((s) => s.user)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [actioningId, setActioningId] = useState<string | null>(null)

  const isProvider = user?.user_type === 'provider'

  const load = () => {
    setLoading(true)
    bookingService
      .list()
      .then((res) => setBookings(res.data))
      .catch((err: Error) => toast.error(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const runAction = async (
    action: (id: string) => Promise<unknown>,
    bookingId: string,
    successMessage: string
  ) => {
    setActioningId(bookingId)
    try {
      await action(bookingId)
      toast.success(successMessage)
      load()
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setActioningId(null)
    }
  }

  if (loading) return <LoadingSpinner label="Loading bookings…" />

  return (
    <div>
      <h1 className="mb-6 text-xl font-semibold text-gray-900">Your bookings</h1>

      {bookings.length === 0 ? (
        <EmptyState
          title="No bookings yet"
          description="Browse services and request a booking to get started."
        />
      ) : (
        <ul className="flex flex-col gap-4">
          {bookings.map((booking) => (
            <li key={booking.id} className="card flex flex-col gap-3 p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-900">
                  Booking #{booking.id.slice(0, 8)}
                </p>
                <span className={`badge ${STATUS_STYLES[booking.status]}`}>
                  {booking.status}
                </span>
              </div>
              <p className="text-sm text-gray-600">
                Scheduled for {new Date(booking.scheduled_date).toLocaleString()}
              </p>
              {booking.service_address && (
                <p className="text-sm text-gray-500">{booking.service_address}</p>
              )}
              {booking.notes && <p className="text-sm text-gray-500">Notes: {booking.notes}</p>}

              <div className="flex flex-wrap gap-2 pt-2">
                {isProvider && booking.status === 'requested' && (
                  <>
                    <button
                      className="btn-primary"
                      disabled={actioningId === booking.id}
                      onClick={() => runAction(bookingService.accept, booking.id, 'Booking accepted')}
                    >
                      Accept
                    </button>
                    <button
                      className="btn-danger"
                      disabled={actioningId === booking.id}
                      onClick={() => runAction(bookingService.reject, booking.id, 'Booking rejected')}
                    >
                      Reject
                    </button>
                  </>
                )}
                {isProvider && booking.status === 'accepted' && (
                  <button
                    className="btn-primary"
                    disabled={actioningId === booking.id}
                    onClick={() => runAction(bookingService.complete, booking.id, 'Booking completed')}
                  >
                    Mark complete
                  </button>
                )}
                {!isProvider && ['requested', 'accepted'].includes(booking.status) && (
                  <button
                    className="btn-secondary"
                    disabled={actioningId === booking.id}
                    onClick={() => runAction(bookingService.cancel, booking.id, 'Booking cancelled')}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
