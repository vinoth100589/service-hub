import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
      <h1 className="text-3xl font-bold text-gray-900">404</h1>
      <p className="text-gray-600">The page you are looking for doesn&apos;t exist.</p>
      <Link to="/" className="btn-primary">
        Back to home
      </Link>
    </div>
  )
}
