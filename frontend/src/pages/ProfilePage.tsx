import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import LoadingSpinner from '@components/common/LoadingSpinner'
import EmptyState from '@components/common/EmptyState'
import { paymentService } from '@services/paymentService'
import { providerService } from '@services/providerService'
import { useAuthStore } from '@store/authStore'
import type { Payment } from '@/types'

export default function ProfilePage() {
  const user = useAuthStore((s) => s.user)
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [applying, setApplying] = useState(false)
  const [applyForm, setApplyForm] = useState({ business_name: '', business_description: '' })

  useEffect(() => {
    paymentService
      .list()
      .then((res) => setPayments(res.data))
      .catch((err: Error) => toast.error(err.message))
      .finally(() => setLoading(false))
  }, [])

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault()
    setApplying(true)
    try {
      await providerService.apply({
        business_name: applyForm.business_name,
        business_description: applyForm.business_description || undefined,
        service_categories: [],
      })
      toast.success('Provider application submitted!')
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setApplying(false)
    }
  }

  if (!user) return null

  return (
    <div className="flex flex-col gap-6">
      <div className="card p-6">
        <h1 className="text-xl font-semibold text-gray-900">
          {user.first_name} {user.last_name}
        </h1>
        <p className="text-sm text-gray-500">{user.email}</p>
        <span className="badge mt-2 bg-primary-50 text-primary-700">{user.user_type}</span>
      </div>

      {user.user_type === 'customer' && (
        <div className="card p-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Become a provider</h2>
          <form className="flex flex-col gap-4" onSubmit={handleApply}>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">
                Business name
              </label>
              <input
                required
                className="input"
                value={applyForm.business_name}
                onChange={(e) =>
                  setApplyForm({ ...applyForm, business_name: e.target.value })
                }
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">
                Business description
              </label>
              <textarea
                className="input"
                rows={3}
                value={applyForm.business_description}
                onChange={(e) =>
                  setApplyForm({ ...applyForm, business_description: e.target.value })
                }
              />
            </div>
            <button type="submit" className="btn-primary" disabled={applying}>
              {applying ? 'Submitting…' : 'Apply as provider'}
            </button>
          </form>
        </div>
      )}

      <div className="card p-6">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Payment history</h2>
        {loading ? (
          <LoadingSpinner label="Loading payments…" />
        ) : payments.length === 0 ? (
          <EmptyState title="No payments yet" />
        ) : (
          <ul className="divide-y divide-gray-100">
            {payments.map((payment) => (
              <li key={payment.id} className="flex items-center justify-between py-3 text-sm">
                <span className="text-gray-600">
                  Booking #{payment.booking_id.slice(0, 8)}
                </span>
                <span className="font-medium text-gray-900">${payment.amount}</span>
                <span className="badge bg-gray-100 text-gray-600">{payment.status}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
