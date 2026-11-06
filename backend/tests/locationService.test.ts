jest.mock('@config/database', () => ({
  query: jest.fn(),
}));

import { query } from '@config/database';
import { LocationService } from '../src/services/locationService';

const mockQuery = query as jest.Mock;

beforeEach(() => {
  mockQuery.mockReset();
});

describe('LocationService.findServicesNearby', () => {
  it('returns distance_km as a number, not a string', async () => {
    // Regression test: the frontend only renders the "X km away" badge when
    // typeof distance_km === 'number' (see ServiceCard.tsx) — distance_km
    // used to be built with .toFixed(2), which returns a string and made the
    // badge silently never render for nearby-search results.
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: 'service-1', distance_meters: 1234.5, total_count: '1' }],
    });

    const result = await LocationService.findServicesNearby(12.9, 77.6, 5);

    expect(typeof result.services[0].distance_km).toBe('number');
    expect(result.services[0].distance_km).toBeCloseTo(1.23, 2);
  });

  it('passes longitude before latitude and converts the radius to meters', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    await LocationService.findServicesNearby(12.9, 77.6, 5, 20, 10);

    const [, params] = mockQuery.mock.calls[0];
    expect(params).toEqual([77.6, 12.9, 5000, 20, 10]);
  });

  it('reports a total of 0 when no services are nearby', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    const result = await LocationService.findServicesNearby(12.9, 77.6);

    expect(result.total).toBe(0);
    expect(result.services).toEqual([]);
  });
});
