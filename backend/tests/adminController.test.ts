jest.mock('@config/database', () => ({
  query: jest.fn(),
}));

jest.mock('@services/notificationService', () => ({
  NotificationService: { create: jest.fn() },
}));

import { Request, Response } from 'express';
import { query } from '@config/database';
import { NotificationService } from '@services/notificationService';
import { AdminController } from '../src/controllers/adminController';

const mockQuery = query as jest.Mock;

function mockRes() {
  const res: Partial<Response> = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res as Response;
}

function mockReq(overrides: Partial<Request> = {}): Request {
  return {
    user: { id: 'admin-1', user_type: 'admin' },
    params: { dispute_id: 'dispute-1' },
    body: { resolution: 'Refund issued', refund_amount: 25 },
    ...overrides,
  } as unknown as Request;
}

beforeEach(() => {
  mockQuery.mockReset();
  (NotificationService.create as jest.Mock).mockReset();
});

describe('AdminController.resolveDispute', () => {
  it('rejects a non-admin user', async () => {
    const req = mockReq({ user: { id: 'user-1', user_type: 'customer' } } as any);
    const res = mockRes();
    await AdminController.resolveDispute(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(mockQuery).not.toHaveBeenCalled();
  });

  it('only updates a dispute that is still open or under_review', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });
    const res = mockRes();
    await AdminController.resolveDispute(mockReq(), res);

    expect(mockQuery.mock.calls[0][0]).toContain("status IN ('open', 'under_review')");
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('notifies both the customer and the provider once resolved', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: 'dispute-1', booking_id: 'booking-1', title: 'Late arrival', resolution: 'Refund issued' }],
    });
    mockQuery.mockResolvedValueOnce({
      rows: [{ customer_id: 'customer-1', provider_user_id: 'provider-user-1' }],
    });

    const res = mockRes();
    await AdminController.resolveDispute(mockReq(), res);

    expect(NotificationService.create).toHaveBeenCalledWith(
      'customer-1',
      'dispute_resolved',
      expect.any(String),
      expect.any(String),
      'dispute-1',
    );
    expect(NotificationService.create).toHaveBeenCalledWith(
      'provider-user-1',
      'dispute_resolved',
      expect.any(String),
      expect.any(String),
      'dispute-1',
    );
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('still succeeds (without notifying) if the booking lookup finds no participants', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: 'dispute-1', booking_id: 'booking-1', title: 'Late arrival', resolution: 'Refund issued' }],
    });
    mockQuery.mockResolvedValueOnce({ rows: [] });

    const res = mockRes();
    await AdminController.resolveDispute(mockReq(), res);

    expect(NotificationService.create).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });
});
