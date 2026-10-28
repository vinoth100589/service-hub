import { Link } from 'react-router-dom'
import RatingStars from '@components/common/RatingStars'
import type { Service } from '@/types'

export default function ServiceCard({ service }: { service: Service }) {
  const priceLabel =
    service.price_unit === 'hourly' ? `$${service.base_price}/hr` : `$${service.base_price}`

  return (
    <Link
      to={`/services/${service.id}`}
      className="card flex flex-col gap-3 p-4 transition-shadow hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-primary-600">
            {service.category}
          </p>
          <h3 className="text-base font-semibold text-gray-900">{service.name}</h3>
        </div>
        <span className="badge bg-primary-50 text-primary-700">{priceLabel}</span>
      </div>

      <p className="line-clamp-2 text-sm text-gray-600">{service.description}</p>

      <div className="flex items-center justify-between">
        <RatingStars rating={service.rating} reviewCount={service.review_count} />
        {typeof service.distance_km === 'number' && (
          <span className="text-xs text-gray-500">{service.distance_km} km away</span>
        )}
      </div>

      {service.provider && (
        <p className="text-xs text-gray-500">by {service.provider.business_name}</p>
      )}
    </Link>
  )
}
