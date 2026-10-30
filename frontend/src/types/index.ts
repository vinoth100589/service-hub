export type UserType = 'customer' | 'provider' | 'admin'

export interface User {
  id: string
  email: string
  first_name: string
  last_name: string
  user_type: UserType
  phone?: string
  verified_email?: boolean
  avatar_url?: string
}

export interface Provider {
  id: string
  user_id: string
  business_name: string
  business_description?: string
  average_rating: number
  total_reviews: number
  total_bookings: number
  verification_status: 'pending' | 'verified' | 'rejected'
  latitude?: number
  longitude?: number
}

export type PriceUnit = 'flat_rate' | 'hourly'

export interface Service {
  id: string
  provider_id: string
  name: string
  description: string
  category: string
  subcategory?: string
  base_price: number
  price_unit?: PriceUnit
  duration_minutes?: number
  rating: number
  review_count: number
  images: string[]
  created_at: string
  provider?: Provider
  distance_km?: number | null
}

// Must match the backend's bookings.status column exactly (see
// database/schema/tables.sql and bookingController.ts) — a value here that
// the backend never actually sets (the previous 'pending') silently breaks
// every status-dependent check in the UI instead of failing loudly.
export type BookingStatus =
  | 'requested'
  | 'accepted'
  | 'rejected'
  | 'in_progress'
  | 'completed'
  | 'cancelled'

export interface Booking {
  id: string
  user_id: string
  provider_id: string
  service_id: string
  status: BookingStatus
  scheduled_date: string
  scheduled_duration_minutes?: number
  service_address?: string
  notes?: string
  created_at: string
}

export interface Review {
  id: string
  booking_id: string
  reviewer_id: string
  reviewee_id: string
  rating: number
  title: string
  content: string
  cleanliness_rating?: number
  professionalism_rating?: number
  punctuality_rating?: number
  created_at: string
}

export interface Message {
  id: string
  booking_id: string
  sender_id: string
  receiver_id: string
  content: string
  file_url?: string
  read?: boolean
  created_at: string
}

export interface Conversation {
  booking_id: string
  last_message: string
  last_message_time: string
}

export type PaymentStatus = 'pending' | 'completed' | 'refunded' | 'failed'

export interface Payment {
  id: string
  booking_id: string
  user_id: string
  provider_id: string
  amount: number
  status: PaymentStatus
  created_at: string
}

export interface Pagination {
  total: number
  limit: number
  offset: number
  pages: number
}

export interface AdminDashboard {
  total_customers: number
  verified_providers: number
  completed_bookings: number
  total_revenue: number
}

export interface ApiListResponse<T> {
  message?: string
  data: T[]
  pagination?: Pagination
}

export interface ApiItemResponse<T> {
  message?: string
  data: T
}

export interface AuthResponse {
  message: string
  user: User
  access_token: string
}
