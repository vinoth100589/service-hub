import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Layout from '@components/layout/Layout'
import ProtectedRoute from '@components/common/ProtectedRoute'
import HomePage from '@pages/HomePage'
import ServiceDetailPage from '@pages/ServiceDetailPage'
import LoginPage from '@pages/LoginPage'
import RegisterPage from '@pages/RegisterPage'
import BookingsPage from '@pages/BookingsPage'
import MessagesPage from '@pages/MessagesPage'
import ProfilePage from '@pages/ProfilePage'
import ProviderDashboardPage from '@pages/ProviderDashboardPage'
import AdminDashboardPage from '@pages/AdminDashboardPage'
import NotFoundPage from '@pages/NotFoundPage'

export default function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="services/:serviceId" element={<ServiceDetailPage />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />

          <Route element={<ProtectedRoute />}>
            <Route path="bookings" element={<BookingsPage />} />
            <Route path="messages" element={<MessagesPage />} />
            <Route path="profile" element={<ProfilePage />} />
          </Route>

          <Route element={<ProtectedRoute roles={['provider']} />}>
            <Route path="provider/dashboard" element={<ProviderDashboardPage />} />
          </Route>

          <Route element={<ProtectedRoute roles={['admin']} />}>
            <Route path="admin/dashboard" element={<AdminDashboardPage />} />
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
