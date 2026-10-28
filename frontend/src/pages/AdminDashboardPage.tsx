import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import LoadingSpinner from '@components/common/LoadingSpinner'
import EmptyState from '@components/common/EmptyState'
import { adminService } from '@services/adminService'
import type { AdminDashboard, Provider } from '@/types'

export default function AdminDashboardPage() {
  const [dashboard, setDashboard] = useState<AdminDashboard | null>(null)
  const [pendingProviders, setPendingProviders] = useState<Provider[]>([])
  const [loading, setLoading] = useState(true)
  const [actioningId, setActioningId] = useState<string | null>(null)

  const load = () => {
    setLoading(true)
    Promise.allSettled([adminService.getDashboard(), adminService.getPendingProviders()])
      .then(([dashboardRes, providersRes]) => {
        if (dashboardRes.status === 'fulfilled') setDashboard(dashboardRes.value.data)
        if (providersRes.status === 'fulfilled') setPendingProviders(providersRes.value.data)
      })
      .catch((err: Error) => toast.error(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const handleDecision = async (providerId: string, verify: boolean) => {
    setActioningId(providerId)
    try {
      if (verify) {
        await adminService.verifyProvider(providerId)
        toast.success('Provider verified')
      } else {
        await adminService.rejectProvider(providerId)
        toast.success('Provider rejected')
      }
      load()
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setActioningId(null)
    }
  }

  if (loading) return <LoadingSpinner label="Loading dashboard…" />

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold text-gray-900">Admin dashboard</h1>

      {dashboard && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <div className="card p-4">
            <p className="text-xs text-gray-500">Customers</p>
            <p className="text-xl font-bold text-gray-900">{dashboard.total_customers}</p>
          </div>
          <div className="card p-4">
            <p className="text-xs text-gray-500">Verified providers</p>
            <p className="text-xl font-bold text-gray-900">{dashboard.verified_providers}</p>
          </div>
          <div className="card p-4">
            <p className="text-xs text-gray-500">Completed bookings</p>
            <p className="text-xl font-bold text-gray-900">{dashboard.completed_bookings}</p>
          </div>
          <div className="card p-4">
            <p className="text-xs text-gray-500">Total revenue</p>
            <p className="text-xl font-bold text-gray-900">${dashboard.total_revenue}</p>
          </div>
        </div>
      )}

      <div className="card p-6">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Pending provider applications</h2>
        {pendingProviders.length === 0 ? (
          <EmptyState title="No pending applications" />
        ) : (
          <ul className="divide-y divide-gray-100">
            {pendingProviders.map((provider) => (
              <li key={provider.id} className="flex items-center justify-between py-3">
                <p className="text-sm font-medium text-gray-900">{provider.business_name}</p>
                <div className="flex gap-2">
                  <button
                    className="btn-primary"
                    disabled={actioningId === provider.id}
                    onClick={() => handleDecision(provider.id, true)}
                  >
                    Verify
                  </button>
                  <button
                    className="btn-danger"
                    disabled={actioningId === provider.id}
                    onClick={() => handleDecision(provider.id, false)}
                  >
                    Reject
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
