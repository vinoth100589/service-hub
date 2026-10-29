jest.mock('@config/database', () => ({
  query: jest.fn(),
}));

import { query } from '@config/database';
import { ServiceService } from '../src/services/serviceService';

const mockQuery = query as jest.Mock;

function lastCall() {
  const [sql, params] = mockQuery.mock.calls[mockQuery.mock.calls.length - 1];
  return { sql: sql as string, params: params as unknown[] };
}

beforeEach(() => {
  mockQuery.mockReset();
  mockQuery.mockResolvedValue({ rows: [] });
});

describe('ServiceService.listServices', () => {
  it('applies only the base filters and default sort/pagination with no filters given', async () => {
    await ServiceService.listServices({});
    const { sql, params } = lastCall();

    expect(sql).toContain("p.verification_status = 'verified'");
    expect(sql).toContain('ORDER BY s.created_at DESC');
    expect(sql).not.toContain('ILIKE');
    expect(sql).not.toContain('ST_DWithin');
    // minRating defaults to 0, limit 20, offset 0
    expect(params).toEqual([0, 20, 0]);
  });

  it('parameterizes the free-text search instead of inlining it', async () => {
    await ServiceService.listServices({ q: "o'brien plumbing" });
    const { sql, params } = lastCall();

    expect(sql).toContain('s.name ILIKE $2');
    expect(sql).not.toContain("o'brien");
    expect(params).toContain("%o'brien plumbing%");
  });

  it('adds category and price-range conditions with correct placeholders', async () => {
    await ServiceService.listServices({ category: 'cleaning', minPrice: 50, maxPrice: 200 });
    const { sql, params } = lastCall();

    expect(sql).toContain('s.category = $2');
    expect(sql).toContain('s.base_price >= $3');
    expect(sql).toContain('s.base_price <= $4');
    expect(params).toEqual([0, 'cleaning', 50, 200, 20, 0]);
  });

  it('adds a location radius filter and distance column when lat/lng are given', async () => {
    await ServiceService.listServices({ latitude: 12.9, longitude: 77.6, radiusKm: 5 });
    const { sql, params } = lastCall();

    expect(sql).toContain('ST_DWithin');
    expect(sql).toContain('ST_Distance');
    // longitude, latitude, radiusMeters appended after minRating
    expect(params).toEqual([0, 77.6, 12.9, 5000, 20, 0]);
  });

  it('sorts by nearest when latitude/longitude are both exactly 0', async () => {
    // Regression test: the nearest-sort branch used to check `if (latitude && longitude)`,
    // which is falsy for 0 (a real coordinate — the equator / Greenwich meridian) and
    // silently fell back to the default sort instead of sorting by distance.
    await ServiceService.listServices({ latitude: 0, longitude: 0, sortBy: 'nearest' });
    const { sql } = lastCall();

    expect(sql).toContain('ORDER BY ST_Distance');
  });

  it('falls back to default sort for "nearest" when no coordinates are given', async () => {
    await ServiceService.listServices({ sortBy: 'nearest' });
    const { sql } = lastCall();

    expect(sql).toContain('ORDER BY s.created_at DESC');
  });

  it.each([
    ['rating', 'ORDER BY s.rating DESC, s.review_count DESC'],
    ['best', 'ORDER BY s.rating DESC, s.review_count DESC'],
    ['price-low', 'ORDER BY s.base_price ASC'],
    ['price-high', 'ORDER BY s.base_price DESC'],
    ['reviews', 'ORDER BY s.review_count DESC, s.rating DESC'],
  ] as const)('maps sortBy=%s to the correct ORDER BY clause', async (sortBy, expectedClause) => {
    await ServiceService.listServices({ sortBy });
    const { sql } = lastCall();

    expect(sql).toContain(expectedClause);
  });

  it('passes limit/offset through for pagination', async () => {
    await ServiceService.listServices({ limit: 5, offset: 15 });
    const { params } = lastCall();

    expect(params).toEqual([0, 5, 15]);
  });

  it('returns the total count and rows from the query result', async () => {
    mockQuery.mockResolvedValue({
      rows: [{ id: 'svc-1', total_count: '3' }, { id: 'svc-2', total_count: '3' }],
    });

    const result = await ServiceService.listServices({});

    expect(result.total).toBe(3);
    expect(result.services).toHaveLength(2);
  });

  it('reports a total of 0 when no rows match', async () => {
    mockQuery.mockResolvedValue({ rows: [] });

    const result = await ServiceService.listServices({});

    expect(result.total).toBe(0);
    expect(result.services).toEqual([]);
  });
});
