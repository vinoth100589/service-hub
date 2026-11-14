jest.mock('@config/database', () => ({
  query: jest.fn(),
}));

import { Request, Response } from 'express';
import { query } from '@config/database';
import { NotificationController } from '../src/controllers/notificationController';

const mockQuery = query as jest.Mock;

function mockRes() {
  const res: Partial<Response> = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res as Response;
}

function mockReq(overrides: Partial<Request> = {}): Request {
  return { user: { id: 'user-1' }, params: {}, query: {}, ...overrides } as unknown as Request;
}

beforeEach(() => {
  mockQuery.mockReset();
});

describe('NotificationController.listNotifications', () => {
  it('rejects an unauthenticated request', async () => {
    const res = mockRes();
    await NotificationController.listNotifications(mockReq({ user: undefined } as any), res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(mockQuery).not.toHaveBeenCalled();
  });

  it('scopes notifications to the current user and returns the unread count as a number', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: 'notif-1', user_id: 'user-1', title: 'Booking accepted' }],
    });
    mockQuery.mockResolvedValueOnce({ rows: [{ count: '3' }] });

    const res = mockRes();
    await NotificationController.listNotifications(mockReq(), res);

    expect(mockQuery.mock.calls[0][1]).toEqual(['user-1', 30, 0]);
    expect(mockQuery.mock.calls[1][0]).toContain('is_read = false');
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ unread_count: 3 }),
    );
  });

  it('passes through custom limit/offset', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });
    mockQuery.mockResolvedValueOnce({ rows: [{ count: '0' }] });

    const res = mockRes();
    await NotificationController.listNotifications(
      mockReq({ query: { limit: '5', offset: '10' } } as any),
      res,
    );

    expect(mockQuery.mock.calls[0][1]).toEqual(['user-1', '5', '10']);
  });
});

describe('NotificationController.markAsRead', () => {
  it('rejects an unauthenticated request', async () => {
    const res = mockRes();
    await NotificationController.markAsRead(mockReq({ user: undefined } as any), res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(mockQuery).not.toHaveBeenCalled();
  });

  it('only updates a notification owned by the current user', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    const res = mockRes();
    await NotificationController.markAsRead(mockReq({ params: { id: 'notif-1' } } as any), res);

    expect(mockQuery.mock.calls[0][1]).toEqual(['notif-1', 'user-1']);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('marks the notification read and returns it', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ id: 'notif-1', is_read: true }] });

    const res = mockRes();
    await NotificationController.markAsRead(mockReq({ params: { id: 'notif-1' } } as any), res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ data: { id: 'notif-1', is_read: true } });
  });
});

describe('NotificationController.markAllAsRead', () => {
  it('rejects an unauthenticated request', async () => {
    const res = mockRes();
    await NotificationController.markAllAsRead(mockReq({ user: undefined } as any), res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(mockQuery).not.toHaveBeenCalled();
  });

  it('only marks the current user\'s unread notifications as read', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    const res = mockRes();
    await NotificationController.markAllAsRead(mockReq(), res);

    const [sql, params] = mockQuery.mock.calls[0];
    expect(sql).toContain('is_read = false');
    expect(params).toEqual(['user-1']);
    expect(res.status).toHaveBeenCalledWith(200);
  });
});
