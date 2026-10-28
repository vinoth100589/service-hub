import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuthStore } from '@store/authStore'
import { authService } from '@services/authService'

export default function RegisterPage() {
  const navigate = useNavigate()
  const login = useAuthStore((s) => s.login)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
  })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (isAuthenticated) navigate('/', { replace: true })
  }, [isAuthenticated, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const res = await authService.register(form)
      login(res.user, res.access_token)
      toast.success('Welcome to ServiceHub!')
      navigate('/', { replace: true })
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <div className="card p-6">
        <h1 className="mb-6 text-xl font-semibold text-gray-900">Create your account</h1>
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">First name</label>
              <input
                required
                className="input"
                value={form.first_name}
                onChange={(e) => setForm({ ...form, first_name: e.target.value })}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Last name</label>
              <input
                required
                className="input"
                value={form.last_name}
                onChange={(e) => setForm({ ...form, last_name: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Email</label>
            <input
              required
              type="email"
              className="input"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Password</label>
            <input
              required
              minLength={6}
              type="password"
              className="input"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </div>

          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? 'Creating account…' : 'Sign up'}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-500">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-primary-600 hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  )
}
