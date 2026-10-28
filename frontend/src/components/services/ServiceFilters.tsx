import { SERVICE_CATEGORIES, SORT_OPTIONS } from '@config/constants'

export interface ServiceFilterValues {
  q: string
  category: string
  minPrice: string
  maxPrice: string
  minRating: string
  sortBy: string
}

interface ServiceFiltersProps {
  values: ServiceFilterValues
  onChange: (values: ServiceFilterValues) => void
}

export default function ServiceFilters({ values, onChange }: ServiceFiltersProps) {
  const update = (patch: Partial<ServiceFilterValues>) => onChange({ ...values, ...patch })

  return (
    <div className="card flex flex-col gap-4 p-4">
      <div>
        <label className="mb-1 block text-xs font-medium text-gray-600">Search</label>
        <input
          className="input"
          placeholder="Search services…"
          value={values.q}
          onChange={(e) => update({ q: e.target.value })}
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-gray-600">Category</label>
        <select
          className="input"
          value={values.category}
          onChange={(e) => update({ category: e.target.value })}
        >
          <option value="">All categories</option>
          {SERVICE_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c.replace('_', ' ')}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">Min price</label>
          <input
            type="number"
            min={0}
            className="input"
            value={values.minPrice}
            onChange={(e) => update({ minPrice: e.target.value })}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">Max price</label>
          <input
            type="number"
            min={0}
            className="input"
            value={values.maxPrice}
            onChange={(e) => update({ maxPrice: e.target.value })}
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-gray-600">Minimum rating</label>
        <select
          className="input"
          value={values.minRating}
          onChange={(e) => update({ minRating: e.target.value })}
        >
          <option value="">Any rating</option>
          {[4.5, 4, 3.5, 3].map((r) => (
            <option key={r} value={r}>
              {r}+ stars
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-gray-600">Sort by</label>
        <select
          className="input"
          value={values.sortBy}
          onChange={(e) => update({ sortBy: e.target.value })}
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}
