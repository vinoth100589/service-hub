jest.mock('@config/database', () => ({
  query: jest.fn(),
  getClient: jest.fn(),
}));

jest.mock('@services/notificationService', () => ({
  NotificationService: { create: jest.fn() },
}));

import { Request, Response } from 'express';
import { query } from '@config/database';
import { ReviewController, recomputeProviderRating } from '../src/controllers/reviewController';

const mockQuery = query as jest.Mock;

function mockRes() {
  const res: Partial<Response> = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res as Response;
}

function mockReq(overrides: Partial<Request> = {}): Request {
  return { user: { id: 'user-1' }, params: {}, body: {}, query: {}, ...overrides } as unknown as Request;
}

beforeEach(() => {
  mockQuery.mockReset();
});

describe('recomputeProviderRating', () => {
  it('recomputes average_rating and total_reviews for the provider user', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });
    await recomputeProviderRating('provider-user-1');

    const [sql, params] = mockQuery.mock.calls[0];
    expect(sql).toContain('UPDATE providers SET average_rating');
    expect(sql).toContain('total_reviews');
    expect(params).toEqual(['provider-user-1']);
  });

  it('coalesces average_rating to 0 instead of leaving it NULL when no reviews remain', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });
    await recomputeProviderRating('provider-user-1');

    const [sql] = mockQuery.mock.calls[0];
    expect(sql).toContain('COALESCE((SELECT AVG(rating)');
  });
});

describe('ReviewController.updateReview', () => {
  it('recomputes the provider rating when the rating itself changes', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ id: 'review-1', reviewee_id: 'provider-user-1' }] });
    mockQuery.mockResolvedValueOnce({ rows: [] }); // recompute UPDATE

    const req = mockReq({ params: { id: 'review-1' }, body: { rating: 2 } } as any);
    await ReviewController.updateReview(req, mockRes());

    expect(mockQuery).toHaveBeenCalledTimes(2);
    expect(mockQuery.mock.calls[1][0]).toContain('UPDATE providers SET average_rating');
    expect(mockQuery.mock.calls[1][1]).toEqual(['provider-user-1']);
  });

  it('does not recompute the provider rating when only the review text changes', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ id: 'review-1', reviewee_id: 'provider-user-1' }] });

    const req = mockReq({ params: { id: 'review-1' }, body: { content: 'updated text' } } as any);
    await ReviewController.updateReview(req, mockRes());

    expect(mockQuery).toHaveBeenCalledTimes(1);
  });

  it('does not touch provider ratings when the review is not found', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    const req = mockReq({ params: { id: 'missing' }, body: { rating: 5 } } as any);
    const res = mockRes();
    await ReviewController.updateReview(req, res);

    expect(mockQuery).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(404);
  });
});

describe('ReviewController.deleteReview', () => {
  it('recomputes the provider rating for the deleted review\'s reviewee', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ id: 'review-1', reviewee_id: 'provider-user-1' }] });
    mockQuery.mockResolvedValueOnce({ rows: [] }); // recompute UPDATE

    const req = mockReq({ params: { id: 'review-1' } } as any);
    await ReviewController.deleteReview(req, mockRes());

    expect(mockQuery).toHaveBeenCalledTimes(2);
    expect(mockQuery.mock.calls[0][0]).toContain('RETURNING id, reviewee_id');
    expect(mockQuery.mock.calls[1][0]).toContain('UPDATE providers SET average_rating');
    expect(mockQuery.mock.calls[1][1]).toEqual(['provider-user-1']);
  });

  it('does not touch provider ratings when the review is not found or not owned by this user', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    const req = mockReq({ params: { id: 'review-1' } } as any);
    const res = mockRes();
    await ReviewController.deleteReview(req, res);

    expect(mockQuery).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(404);
  });
});

describe('ReviewController.submitReview', () => {
  it('recomputes the provider rating after inserting the new review', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ reviewee_id: 'provider-user-1' }] }); // booking lookup
    mockQuery.mockResolvedValueOnce({ rows: [{ id: 'review-1' }] }); // insert
    mockQuery.mockResolvedValueOnce({ rows: [] }); // recompute UPDATE

    const req = mockReq({ body: { booking_id: 'booking-1', rating: 5 } } as any);
    const res = mockRes();
    await ReviewController.submitReview(req, res);

    expect(mockQuery).toHaveBeenCalledTimes(3);
    expect(mockQuery.mock.calls[2][0]).toContain('UPDATE providers SET average_rating');
    expect(mockQuery.mock.calls[2][1]).toEqual(['provider-user-1']);
    expect(res.status).toHaveBeenCalledWith(201);
  });
});
