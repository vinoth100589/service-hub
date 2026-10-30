jest.mock('@config/database', () => ({
  query: jest.fn(),
  getClient: jest.fn(),
}));

jest.mock('@services/stripeService', () => ({
  StripeService: {
    isConfigured: jest.fn().mockReturnValue(false),
    createPaymentIntent: jest.fn(),
    retrievePaymentIntent: jest.fn(),
    createRefund: jest.fn(),
    constructWebhookEvent: jest.fn(),
  },
}));

import { Request, Response } from 'express';
import { query } from '@config/database';
import { StripeService } from '@services/stripeService';
import { PaymentController } from '../src/controllers/paymentController';

const mockQuery = query as jest.Mock;

function mockRes() {
  const res: Partial<Response> = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res as Response;
}

function mockReq(overrides: Partial<Request> = {}): Request {
  return { user: { id: 'provider-user-1' }, params: {}, body: {}, query: {}, ...overrides } as unknown as Request;
}

beforeEach(() => {
  mockQuery.mockReset();
});

describe('PaymentController.getPayouts', () => {
  it('sums provider_payout_amount numerically even though pg returns DECIMAL columns as strings', async () => {
    // Real node-postgres behavior for NUMERIC/DECIMAL columns: strings, not numbers.
    mockQuery.mockResolvedValueOnce({
      rows: [
        { id: 'pay-1', provider_payout_amount: '42.50' },
        { id: 'pay-2', provider_payout_amount: '17.25' },
        { id: 'pay-3', provider_payout_amount: '0.25' },
      ],
    });

    const req = mockReq();
    const res = mockRes();
    await PaymentController.getPayouts(req, res);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ total_earnings: 60 }),
    );
  });

  it('returns 0 total earnings when there are no completed payouts', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    const req = mockReq();
    const res = mockRes();
    await PaymentController.getPayouts(req, res);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ total_earnings: 0 }),
    );
  });

  it('rounds the total to 2 decimal places', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [
        { id: 'pay-1', provider_payout_amount: '10.004' },
        { id: 'pay-2', provider_payout_amount: '0.004' },
      ],
    });

    const req = mockReq();
    const res = mockRes();
    await PaymentController.getPayouts(req, res);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ total_earnings: 10.01 }),
    );
  });
});

// Regression coverage: a booking can only be cancelled (bookingController)
// while still 'requested' or 'accepted', but before this fix these two sites
// advanced a booking straight to 'in_progress' with no status check at all —
// so a payment confirmed after the customer cancelled would silently revive
// the booking. Both now require status = 'accepted'; this just asserts the
// guard clause is present, since the booking outcome itself lives in the DB.
describe('PaymentController.confirmPayment', () => {
  it('only advances a booking to in_progress if it is still accepted', async () => {
    (StripeService.isConfigured as jest.Mock).mockReturnValue(false);
    mockQuery.mockResolvedValueOnce({ rows: [{ stripe_payment_intent_id: null }] }); // payment lookup
    mockQuery.mockResolvedValueOnce({ rows: [{ id: 'payment-1' }] }); // payments UPDATE
    mockQuery.mockResolvedValueOnce({ rows: [] }); // bookings UPDATE

    const req = mockReq({ body: { payment_id: 'payment-1', stripe_charge_id: 'ch_1' } } as any);
    const res = mockRes();
    await PaymentController.confirmPayment(req, res);

    const bookingUpdateCall = mockQuery.mock.calls[2];
    expect(bookingUpdateCall[0]).toContain("status = 'accepted'");
    expect(res.status).toHaveBeenCalledWith(200);
  });
});

describe('PaymentController.handleWebhook payment_intent.succeeded', () => {
  it('only advances the booking to in_progress if it is still accepted', async () => {
    (StripeService.constructWebhookEvent as jest.Mock).mockReturnValue({
      type: 'payment_intent.succeeded',
      data: { object: { id: 'pi_123' } },
    });
    mockQuery.mockResolvedValueOnce({ rows: [] }); // payments UPDATE
    mockQuery.mockResolvedValueOnce({ rows: [] }); // bookings UPDATE

    const req = mockReq({ headers: { 'stripe-signature': 'sig' }, body: Buffer.from('{}') } as any);
    const res = mockRes();
    await PaymentController.handleWebhook(req, res);

    const bookingUpdateCall = mockQuery.mock.calls[1];
    expect(bookingUpdateCall[0]).toContain("status = 'accepted'");
    expect(res.status).toHaveBeenCalledWith(200);
  });
});
