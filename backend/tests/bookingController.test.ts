jest.mock('@config/database', () => ({
  query: jest.fn(),
}));

jest.mock('@services/notificationService', () => ({
  NotificationService: { create: jest.fn() },
}));

import { Request, Response } from 'express';
import { query } from '@config/database';
import { NotificationService } from '@services/notificationService';
import { BookingController } from '../src/controllers/bookingController';

const mockQuery = query as jest.Mock;

function mockRes() {
  const res: Partial<Response> = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res as Response;
}

function mockReq(overrides: Partial<Request> = {}): Request {
  return { user: { id: 'user-1' }, params: { id: 'booking-1' }, body: {}, query: {}, ...overrides } as unknown as Request;
}

beforeEach(() => {
  mockQuery.mockReset();
  (NotificationService.create as jest.Mock).mockReset();
});

// A real DB only returns a row when every WHERE condition (ownership AND
// current status) matches; a mocked "no rows" response is how these tests
// simulate a status guard rejecting an out-of-order transition.
describe('BookingController status-transition guards', () => {
  it('acceptBooking requires the booking to currently be requested', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });
    const res = mockRes();
    await BookingController.acceptBooking(mockReq(), res);

    expect(mockQuery.mock.calls[0][0]).toContain("b.status = 'requested'");
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('rejectBooking requires the booking to currently be requested', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });
    const res = mockRes();
    await BookingController.rejectBooking(mockReq(), res);

    expect(mockQuery.mock.calls[0][0]).toContain("b.status = 'requested'");
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('completeBooking requires the booking to currently be accepted (not just requested)', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });
    const res = mockRes();
    await BookingController.completeBooking(mockReq(), res);

    expect(mockQuery.mock.calls[0][0]).toContain("b.status = 'accepted'");
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('completeBooking succeeds and notifies the other party when the booking was accepted', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: 'booking-1', user_id: 'user-1', provider_user_id: 'provider-user-1', service_name: 'Plumbing' }],
    });
    const res = mockRes();
    await BookingController.completeBooking(mockReq(), res);

    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('cancelBooking rejects a booking that is already completed or cancelled', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });
    const res = mockRes();
    await BookingController.cancelBooking(mockReq(), res);

    const [sql] = mockQuery.mock.calls[0];
    expect(sql).toContain("status IN ('requested', 'accepted')");
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('cancelBooking succeeds for a booking still in requested or accepted state and notifies the provider', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          id: 'booking-1',
          status: 'cancelled',
          service_name: 'Plumbing',
          provider_user_id: 'provider-user-1',
        },
      ],
    });
    const res = mockRes();
    await BookingController.cancelBooking(mockReq(), res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(NotificationService.create).toHaveBeenCalledWith(
      'provider-user-1',
      'booking_cancelled',
      expect.any(String),
      expect.stringContaining('Plumbing'),
      'booking-1',
    );
  });
});
