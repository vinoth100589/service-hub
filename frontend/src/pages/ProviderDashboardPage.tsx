import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import LoadingSpinner from '@components/common/LoadingSpinner'
import EmptyState from '@components/common/EmptyState'
import RatingStars from '@components/common/RatingStars'
import { providerService } from '@services/providerService'
import { paymentService } from '@services/paymentService'
import { bookingService } from '@services/bookingService'
import type { Booking, Payment, Provider } from '@/types'

export default function ProviderDashboardPage() {
  const [profile, setProfile] = useState<Provider | null>(null)
  const [payouts, setPayouts] = useState<Payment[]>([])
  const [totalEarnings, setTotalEarnings] = useState(0)
  const [pendingBookings, setPendingBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.allSettled([
      providerService.getProfile(),
      paymentService.getPayouts(),
      bookingService.list(),
    ])
      .then(([profileRes, payoutsRes, bookingsRes]) => {
        if (profileRes.status === 'fulfilled') setProfile(profileRes.value.data)
        if (payoutsRes.status === 'fulfilled') {
          setPayouts(payoutsRes.value.data)
          setTotalEarnings(payoutsRes.value.total_earnings)
        }
        if (bookingsRes.status === 'fulfilled') {
          setPendingBookings(bookingsRes.value.data.filter((b) => b.status === 'requested'))
        }
      })
      .catch((err: Error) => toast.error(err.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <LoadingSpinner label="Loading dashboard…" />

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold text-gray-900">Provider dashboard</h1>

      {profile && (
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900">{profile.business_name}</h2>
          <RatingStars rating={profile.average_rating} reviewCount={profile.total_reviews} />
          <p className="mt-2 text-sm text-gray-500">
            {profile.total_bookings} total bookings · {profile.verification_status}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="card p-6">
          <p className="text-sm text-gray-500">Total earnings</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">${totalEarnings.toFixed(2)}</p>
        </div>
        <div className="card p-6">
          <p className="text-sm text-gray-500">Pending booking requests</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{pendingBookings.length}</p>
        </div>
      </div>

      <div className="card p-6">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Recent payouts</h2>
        {payouts.length === 0 ? (
          <EmptyState title="No payouts yet" />
        ) : (
          <ul className="divide-y divide-gray-100">
            {payouts.map((payout) => (
              <li key={payout.id} className="flex items-center justify-between py-3 text-sm">
                <span className="text-gray-600">Booking #{payout.booking_id.slice(0, 8)}</span>
                <span className="font-medium text-gray-900">${payout.amount}</span>
                <span className="badge bg-gray-100 text-gray-600">{payout.status}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
