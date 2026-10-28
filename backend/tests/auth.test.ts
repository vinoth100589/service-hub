import request from 'supertest';
import { createApp } from '../src/app';

describe('Auth API', () => {
  let app: ReturnType<typeof createApp>;

  const validUser = {
    email: 'jane@example.com',
    password: 'supersecret123',
    fullName: 'Jane Doe',
  };

  beforeEach(() => {
    app = createApp();
  });

  it('registers a new user and returns tokens', async () => {
    const res = await request(app).post('/api/v1/auth/register').send(validUser);

    expect(res.status).toBe(201);
    expect(res.body.user).toMatchObject({ email: validUser.email, fullName: validUser.fullName, role: 'customer' });
    expect(res.body.user.passwordHash).toBeUndefined();
    expect(res.body.tokens.accessToken).toBeDefined();
    expect(res.body.tokens.refreshToken).toBeDefined();
  });

  it('rejects registration with a weak password', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ ...validUser, email: 'weak@example.com', password: 'short' });

    expect(res.status).toBe(400);
  });

  it('rejects duplicate registration for the same email', async () => {
    await request(app).post('/api/v1/auth/register').send(validUser);
    const res = await request(app).post('/api/v1/auth/register').send(validUser);

    expect(res.status).toBe(409);
  });

  it('logs in with correct credentials', async () => {
    await request(app).post('/api/v1/auth/register').send(validUser);
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: validUser.email, password: validUser.password });

    expect(res.status).toBe(200);
    expect(res.body.tokens.accessToken).toBeDefined();
  });

  it('rejects login with an incorrect password', async () => {
    await request(app).post('/api/v1/auth/register').send(validUser);
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: validUser.email, password: 'wrong-password' });

    expect(res.status).toBe(401);
  });

  it('returns the current user for a valid access token', async () => {
    const registerRes = await request(app).post('/api/v1/auth/register').send(validUser);
    const { accessToken } = registerRes.body.tokens;

    const res = await request(app).get('/api/v1/auth/me').set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe(validUser.email);
  });

  it('rejects /me without an access token', async () => {
    const res = await request(app).get('/api/v1/auth/me');
    expect(res.status).toBe(401);
  });

  it('issues a new token pair from a valid refresh token', async () => {
    const registerRes = await request(app).post('/api/v1/auth/register').send(validUser);
    const { refreshToken } = registerRes.body.tokens;

    const res = await request(app).post('/api/v1/auth/refresh-token').send({ refreshToken });

    expect(res.status).toBe(200);
    expect(res.body.tokens.accessToken).toBeDefined();
  });

  it('rejects refresh with an invalid token', async () => {
    const res = await request(app).post('/api/v1/auth/refresh-token').send({ refreshToken: 'not-a-token' });
    expect(res.status).toBe(401);
  });
});
