jest.mock('@config/database', () => ({
  query: jest.fn(),
}));

jest.mock('@services/notificationService', () => ({
  NotificationService: { create: jest.fn() },
}));

import { Request, Response } from 'express';
import { query } from '@config/database';
import { NotificationService } from '@services/notificationService';
import { MessageController } from '../src/controllers/messageController';

const mockQuery = query as jest.Mock;

function mockRes() {
  const res: Partial<Response> = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res as Response;
}

function mockReq(overrides: Partial<Request> = {}): Request {
  return { user: { id: 'customer-1' }, params: {}, body: {}, query: {}, ...overrides } as unknown as Request;
}

function mockParticipants(customer_id: string, provider_user_id: string) {
  mockQuery.mockResolvedValueOnce({ rows: [{ customer_id, provider_user_id }] });
}

beforeEach(() => {
  mockQuery.mockReset();
  (NotificationService.create as jest.Mock).mockReset();
});

describe('MessageController.sendMessage', () => {
  it('rejects a receiver_id that is not the other participant in the booking', async () => {
    mockParticipants('customer-1', 'provider-user-1');

    const req = mockReq({
      body: { booking_id: 'booking-1', receiver_id: 'some-random-user', content: 'hi' },
    } as any);
    const res = mockRes();
    await MessageController.sendMessage(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.stringContaining('other participant') }),
    );
    // Only the participant-lookup query ran — no insert, no notification.
    expect(mockQuery).toHaveBeenCalledTimes(1);
    expect(NotificationService.create).not.toHaveBeenCalled();
  });

  it('allows the customer to message the provider', async () => {
    mockParticipants('customer-1', 'provider-user-1');
    mockQuery.mockResolvedValueOnce({ rows: [{ id: 'msg-1' }] });

    const req = mockReq({
      body: { booking_id: 'booking-1', receiver_id: 'provider-user-1', content: 'hi' },
    } as any);
    const res = mockRes();
    await MessageController.sendMessage(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(NotificationService.create).toHaveBeenCalledWith(
      'provider-user-1',
      'message_received',
      expect.any(String),
      expect.any(String),
      'booking-1',
    );
  });

  it('allows the provider to message the customer', async () => {
    mockParticipants('customer-1', 'provider-user-1');
    mockQuery.mockResolvedValueOnce({ rows: [{ id: 'msg-2' }] });

    const req = mockReq({
      user: { id: 'provider-user-1' },
      body: { booking_id: 'booking-1', receiver_id: 'customer-1', content: 'sure thing' },
    } as any);
    const res = mockRes();
    await MessageController.sendMessage(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('rejects a sender who is not a participant in the booking at all', async () => {
    mockParticipants('customer-1', 'provider-user-1');

    const req = mockReq({
      user: { id: 'stranger' },
      body: { booking_id: 'booking-1', receiver_id: 'customer-1', content: 'hi' },
    } as any);
    const res = mockRes();
    await MessageController.sendMessage(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('404s when the booking does not exist', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    const req = mockReq({
      body: { booking_id: 'missing', receiver_id: 'anyone', content: 'hi' },
    } as any);
    const res = mockRes();
    await MessageController.sendMessage(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });
});
