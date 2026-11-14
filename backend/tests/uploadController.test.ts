jest.mock('@config/database', () => ({
  query: jest.fn(),
}));

jest.mock('@config/environment', () => ({
  config: { api_base_url: 'https://api.servicehub.test' },
}));

import { Request, Response } from 'express';
import { query } from '@config/database';
import { UploadController } from '../src/controllers/uploadController';

const mockQuery = query as jest.Mock;

function mockRes() {
  const res: Partial<Response> = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res as Response;
}

function mockReq(overrides: Partial<Request> = {}): Request {
  return { user: { id: 'user-1' }, params: {}, ...overrides } as unknown as Request;
}

beforeEach(() => {
  mockQuery.mockReset();
});

describe('UploadController.uploadAvatar', () => {
  it('rejects an unauthenticated request', async () => {
    const res = mockRes();
    await UploadController.uploadAvatar(mockReq({ user: undefined } as any), res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(mockQuery).not.toHaveBeenCalled();
  });

  it('rejects when no file was provided', async () => {
    const res = mockRes();
    await UploadController.uploadAvatar(mockReq({ file: undefined } as any), res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(mockQuery).not.toHaveBeenCalled();
  });

  it('builds a public URL from the uploaded filename and saves it on the user', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [{ avatar_url: 'https://api.servicehub.test/uploads/avatar-123.png' }],
    });

    const req = mockReq({ file: { filename: 'avatar-123.png' } } as any);
    const res = mockRes();
    await UploadController.uploadAvatar(req, res);

    expect(mockQuery.mock.calls[0][1]).toEqual([
      'https://api.servicehub.test/uploads/avatar-123.png',
      'user-1',
    ]);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { avatar_url: 'https://api.servicehub.test/uploads/avatar-123.png' },
      }),
    );
  });
});

describe('UploadController.uploadServiceImages', () => {
  it('rejects an unauthenticated request', async () => {
    const res = mockRes();
    await UploadController.uploadServiceImages(mockReq({ user: undefined, files: [{ filename: 'a.png' }] } as any), res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(mockQuery).not.toHaveBeenCalled();
  });

  it('rejects when no files were provided', async () => {
    const res = mockRes();
    await UploadController.uploadServiceImages(mockReq({ files: [] } as any), res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(mockQuery).not.toHaveBeenCalled();
  });

  it('404s when the service is not found or not owned by this user', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    const req = mockReq({
      params: { serviceId: 'service-1' },
      files: [{ filename: 'a.png' }],
    } as any);
    const res = mockRes();
    await UploadController.uploadServiceImages(req, res);

    expect(mockQuery.mock.calls[0][1]).toEqual(['service-1', 'user-1']);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('appends new image URLs to the service\'s existing gallery rather than replacing it', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ images: ['https://api.servicehub.test/uploads/old.png'] }] });
    mockQuery.mockResolvedValueOnce({
      rows: [{
        images: [
          'https://api.servicehub.test/uploads/old.png',
          'https://api.servicehub.test/uploads/new-1.png',
          'https://api.servicehub.test/uploads/new-2.png',
        ],
      }],
    });

    const req = mockReq({
      params: { serviceId: 'service-1' },
      files: [{ filename: 'new-1.png' }, { filename: 'new-2.png' }],
    } as any);
    const res = mockRes();
    await UploadController.uploadServiceImages(req, res);

    expect(mockQuery.mock.calls[1][1]).toEqual([
      [
        'https://api.servicehub.test/uploads/old.png',
        'https://api.servicehub.test/uploads/new-1.png',
        'https://api.servicehub.test/uploads/new-2.png',
      ],
      'service-1',
    ]);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('handles a service with no existing images', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ images: null }] });
    mockQuery.mockResolvedValueOnce({ rows: [{ images: ['https://api.servicehub.test/uploads/new-1.png'] }] });

    const req = mockReq({
      params: { serviceId: 'service-1' },
      files: [{ filename: 'new-1.png' }],
    } as any);
    const res = mockRes();
    await UploadController.uploadServiceImages(req, res);

    expect(mockQuery.mock.calls[1][1]).toEqual([['https://api.servicehub.test/uploads/new-1.png'], 'service-1']);
  });
});
