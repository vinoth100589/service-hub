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
