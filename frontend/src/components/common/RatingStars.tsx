interface RatingStarsProps {
  rating: number
  size?: number
  showValue?: boolean
  reviewCount?: number
}

export default function RatingStars({
  rating,
  size = 16,
  showValue = true,
  reviewCount,
}: RatingStarsProps) {
  const rounded = Math.round(rating * 2) / 2

  return (
    <div className="flex items-center gap-1">
      <div className="flex" style={{ fontSize: size }}>
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            className={star <= rounded ? 'text-amber-400' : 'text-gray-300'}
            aria-hidden="true"
          >
            ★
          </span>
        ))}
      </div>
      {showValue && (
        <span className="text-sm text-gray-600">
          {rating.toFixed(1)}
          {typeof reviewCount === 'number' ? ` (${reviewCount})` : ''}
        </span>
      )}
    </div>
  )
}
