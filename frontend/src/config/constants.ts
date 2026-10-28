export const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/v1`

export const AUTH_STORAGE_KEY = 'servicehub-auth'

export const SERVICE_CATEGORIES = [
  'plumbing',
  'electrical',
  'cleaning',
  'landscaping',
  'painting',
  'carpentry',
  'moving',
  'appliance_repair',
] as const

export const SORT_OPTIONS: { value: string; label: string }[] = [
  { value: 'newest', label: 'Newest' },
  { value: 'rating', label: 'Top Rated' },
  { value: 'price-low', label: 'Price: Low to High' },
  { value: 'price-high', label: 'Price: High to Low' },
  { value: 'reviews', label: 'Most Reviewed' },
  { value: 'nearest', label: 'Nearest' },
]
