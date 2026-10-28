import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@store/authStore'

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link to="/" className="text-lg font-bold text-primary-700">
          ServiceHub
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-medium text-gray-600 md:flex">
          <Link to="/" className="hover:text-primary-700">
            Find Services
          </Link>
          {isAuthenticated && (
            <Link to="/bookings" className="hover:text-primary-700">
              Bookings
            </Link>
          )}
          {isAuthenticated && (
            <Link to="/messages" className="hover:text-primary-700">
              Messages
            </Link>
          )}
          {isAuthenticated && user?.user_type === 'provider' && (
            <Link to="/provider/dashboard" className="hover:text-primary-700">
              Provider Dashboard
            </Link>
          )}
          {isAuthenticated && user?.user_type === 'admin' && (
            <Link to="/admin/dashboard" className="hover:text-primary-700">
              Admin
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-3">
          {isAuthenticated && user ? (
            <>
              <Link
                to="/profile"
                className="text-sm font-medium text-gray-700 hover:text-primary-700"
              >
                {user.first_name}
              </Link>
              <button className="btn-secondary" onClick={handleLogout}>
                Log out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn-secondary">
                Log in
              </Link>
              <Link to="/register" className="btn-primary">
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
