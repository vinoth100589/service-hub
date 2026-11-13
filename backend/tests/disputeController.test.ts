jest.mock('@config/database', () => ({
  query: jest.fn(),
}));

import { Request, Response } from 'express';
import { query } from '@config/database';
import { DisputeController } from '../src/controllers/disputeController';

const mockQuery = query as jest.Mock;

function mockRes() {
  const res: Partial<Response> = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res as Response;
}

function mockReq(overrides: Partial<Request> = {}): Request {
  return {
    user: { id: 'customer-1', user_type: 'customer' },
    params: {},
    body: { booking_id: 'booking-1', title: 'Late arrival', description: 'Provider arrived 2 hours late' },
    ...overrides,
  } as unknown as Request;
}

function mockParticipants(customer_id: string, provider_user_id: string) {
  mockQuery.mockResolvedValueOnce({ rows: [{ customer_id, provider_user_id }] });
}

beforeEach(() => {
  mockQuery.mockReset();
});

describe('DisputeController.createDispute', () => {
  it('requires booking_id, title, and description', async () => {
    const req = mockReq({ body: { booking_id: 'booking-1' } } as any);
    const res = mockRes();
    await DisputeController.createDispute(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(mockQuery).not.toHaveBeenCalled();
  });

  it('404s when the booking does not exist', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    const res = mockRes();
    await DisputeController.createDispute(mockReq(), res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('rejects a user who is not a participant in the booking', async () => {
    mockParticipants('customer-1', 'provider-user-1');

    const req = mockReq({ user: { id: 'stranger', user_type: 'customer' } } as any);
    const res = mockRes();
    await DisputeController.createDispute(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('rejects filing a second dispute while one is still open or under review', async () => {
    mockParticipants('customer-1', 'provider-user-1');
    mockQuery.mockResolvedValueOnce({ rows: [{ id: 'dispute-existing' }] });

    const res = mockRes();
    await DisputeController.createDispute(mockReq(), res);

    expect(mockQuery.mock.calls[1][0]).toContain("status IN ('open', 'under_review')");
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.stringContaining('already exists') }),
    );
  });

  it('files the dispute when the user is a participant and no open dispute exists', async () => {
    mockParticipants('customer-1', 'provider-user-1');
    mockQuery.mockResolvedValueOnce({ rows: [] }); // no existing dispute
    mockQuery.mockResolvedValueOnce({ rows: [{ id: 'dispute-1', title: 'Late arrival' }] }); // insert

    const res = mockRes();
    await DisputeController.createDispute(mockReq(), res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ id: 'dispute-1' }) }),
    );
  });

  it('lets the provider (not just the customer) file a dispute', async () => {
    mockParticipants('customer-1', 'provider-user-1');
    mockQuery.mockResolvedValueOnce({ rows: [] });
    mockQuery.mockResolvedValueOnce({ rows: [{ id: 'dispute-1' }] });

    const req = mockReq({ user: { id: 'provider-user-1', user_type: 'provider' } } as any);
    const res = mockRes();
    await DisputeController.createDispute(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
  });
});

describe('DisputeController.getDispute', () => {
  it('404s when the dispute does not exist', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    const res = mockRes();
    await DisputeController.getDispute(mockReq({ params: { id: 'missing' } } as any), res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('allows a participant to view the dispute', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: 'dispute-1', customer_id: 'customer-1', provider_user_id: 'provider-user-1' }],
    });

    const res = mockRes();
    await DisputeController.getDispute(
      mockReq({ params: { id: 'dispute-1' }, user: { id: 'customer-1', user_type: 'customer' } } as any),
      res,
    );

    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('allows an admin to view a dispute they are not a participant in', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: 'dispute-1', customer_id: 'customer-1', provider_user_id: 'provider-user-1' }],
    });

    const res = mockRes();
    await DisputeController.getDispute(
      mockReq({ params: { id: 'dispute-1' }, user: { id: 'admin-1', user_type: 'admin' } } as any),
      res,
    );

    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('rejects a non-participant, non-admin user', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: 'dispute-1', customer_id: 'customer-1', provider_user_id: 'provider-user-1' }],
    });

    const res = mockRes();
    await DisputeController.getDispute(
      mockReq({ params: { id: 'dispute-1' }, user: { id: 'stranger', user_type: 'customer' } } as any),
      res,
    );

    expect(res.status).toHaveBeenCalledWith(403);
  });
});

describe('DisputeController.listMyDisputes', () => {
  it('scopes the query to disputes the user initiated or participated in', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    const res = mockRes();
    await DisputeController.listMyDisputes(mockReq(), res);

    const [sql, params] = mockQuery.mock.calls[0];
    expect(sql).toContain('d.initiated_by = $1 OR b.user_id = $1 OR p.user_id = $1');
    expect(params).toEqual(['customer-1']);
    expect(res.status).toHaveBeenCalledWith(200);
  });
});
