jest.mock('@config/database', () => ({
  query: jest.fn(),
}));

import { query } from '@config/database';
import { computeDiscount } from '../src/controllers/promoController';

const mockQuery = query as jest.Mock;

function basePromo(overrides: Record<string, unknown> = {}) {
  return {
    id: 'promo-1',
    code: 'SAVE10',
    discount_type: 'percent',
    discount_value: '10',
    max_discount_amount: null,
    min_booking_amount: null,
    max_redemptions: null,
    redemption_count: 0,
    max_redemptions_per_user: 1,
    valid_from: null,
    valid_until: null,
    is_active: true,
    ...overrides,
  };
}

function mockPromoLookup(promo: Record<string, unknown> | null) {
  mockQuery.mockResolvedValueOnce({ rows: promo ? [promo] : [] });
}

function mockUserRedemptionCount(count: number) {
  mockQuery.mockResolvedValueOnce({ rows: [{ count: String(count) }] });
}

beforeEach(() => {
  mockQuery.mockReset();
});

describe('computeDiscount', () => {
  it('rejects a code with no matching active row', async () => {
    mockPromoLookup(null);
    await expect(computeDiscount('BOGUS', 'user-1', 100)).rejects.toThrow('Invalid promo code');
  });

  it('rejects a code that is not active yet', async () => {
    mockPromoLookup(basePromo({ valid_from: new Date(Date.now() + 86_400_000) }));
    await expect(computeDiscount('SAVE10', 'user-1', 100)).rejects.toThrow('not active yet');
  });

  it('rejects a code that has already expired', async () => {
    mockPromoLookup(basePromo({ valid_until: new Date(Date.now() - 86_400_000) }));
    await expect(computeDiscount('SAVE10', 'user-1', 100)).rejects.toThrow('expired');
  });

  it('rejects a code that has reached its global redemption limit', async () => {
    mockPromoLookup(basePromo({ max_redemptions: 5, redemption_count: 5 }));
    await expect(computeDiscount('SAVE10', 'user-1', 100)).rejects.toThrow('redemption limit');
  });

  it('allows a code with no redemption limit set', async () => {
    mockPromoLookup(basePromo({ max_redemptions: null, redemption_count: 1000 }));
    mockUserRedemptionCount(0);
    await expect(computeDiscount('SAVE10', 'user-1', 100)).resolves.toBeDefined();
  });

  it('rejects a booking below the minimum amount', async () => {
    mockPromoLookup(basePromo({ min_booking_amount: '50.00' }));
    await expect(computeDiscount('SAVE10', 'user-1', 40)).rejects.toThrow('minimum booking of $50.00');
  });

  it('rejects a user who has already redeemed up to their per-user limit', async () => {
    mockPromoLookup(basePromo({ max_redemptions_per_user: 1 }));
    mockUserRedemptionCount(1);
    await expect(computeDiscount('SAVE10', 'user-1', 100)).rejects.toThrow('already used this promo code');
  });

  it('computes a percent discount correctly', async () => {
    mockPromoLookup(basePromo({ discount_type: 'percent', discount_value: '20' }));
    mockUserRedemptionCount(0);
    const { discount } = await computeDiscount('SAVE10', 'user-1', 100);
    expect(discount).toBe(20);
  });

  it('computes a fixed discount correctly', async () => {
    mockPromoLookup(basePromo({ discount_type: 'fixed', discount_value: '15' }));
    mockUserRedemptionCount(0);
    const { discount } = await computeDiscount('SAVE10', 'user-1', 100);
    expect(discount).toBe(15);
  });

  it('caps a percent discount at max_discount_amount', async () => {
    mockPromoLookup(
      basePromo({ discount_type: 'percent', discount_value: '50', max_discount_amount: '10.00' }),
    );
    mockUserRedemptionCount(0);
    const { discount } = await computeDiscount('SAVE10', 'user-1', 100);
    expect(discount).toBe(10);
  });

  it('never discounts more than the booking amount itself', async () => {
    mockPromoLookup(basePromo({ discount_type: 'fixed', discount_value: '500' }));
    mockUserRedemptionCount(0);
    const { discount } = await computeDiscount('SAVE10', 'user-1', 30);
    expect(discount).toBe(30);
  });

  it('rounds the discount to 2 decimal places', async () => {
    mockPromoLookup(basePromo({ discount_type: 'percent', discount_value: '33.333' }));
    mockUserRedemptionCount(0);
    const { discount } = await computeDiscount('SAVE10', 'user-1', 10);
    expect(discount).toBe(3.33);
  });
});
