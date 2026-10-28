import jwt from 'jsonwebtoken';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  decodeToken,
  generatePasswordResetToken,
  verifyPasswordResetToken,
  generateEmailVerificationToken,
  verifyEmailVerificationToken,
  TokenPayload,
} from '../src/utils/jwt';

const payload: TokenPayload = { id: 'user-1', email: 'jane@example.com', user_type: 'customer' };

describe('access/refresh tokens', () => {
  it('round-trips an access token', () => {
    const token = generateAccessToken(payload);
    expect(verifyAccessToken(token)).toMatchObject(payload);
  });

  it('round-trips a refresh token', () => {
    const token = generateRefreshToken(payload);
    expect(verifyRefreshToken(token)).toMatchObject(payload);
  });

  it('rejects a tampered access token', () => {
    const token = generateAccessToken(payload) + 'tampered';
    expect(() => verifyAccessToken(token)).toThrow('Invalid access token');
  });

  it('rejects an expired access token', () => {
    const expired = jwt.sign(payload, process.env.JWT_SECRET || 'dev-secret', {
      expiresIn: -10,
      algorithm: 'HS256',
    });
    expect(() => verifyAccessToken(expired)).toThrow('Access token expired');
  });

  it('decodes a token without verifying it', () => {
    const token = generateAccessToken(payload);
    expect(decodeToken(token)).toMatchObject(payload);
  });
});

describe('purpose-scoped tokens', () => {
  it('round-trips a password reset token', () => {
    const token = generatePasswordResetToken(payload.id, payload.email);
    const decoded = verifyPasswordResetToken(token);
    expect(decoded.id).toBe(payload.id);
    expect(decoded.email).toBe(payload.email);
  });

  it('round-trips an email verification token', () => {
    const token = generateEmailVerificationToken(payload.id, payload.email);
    const decoded = verifyEmailVerificationToken(token);
    expect(decoded.id).toBe(payload.id);
    expect(decoded.email).toBe(payload.email);
  });

  it('rejects a reset token presented as a verification token', () => {
    const resetToken = generatePasswordResetToken(payload.id, payload.email);
    expect(() => verifyEmailVerificationToken(resetToken)).toThrow('Invalid verification link');
  });

  it('rejects a verification token presented as a reset token', () => {
    const verifyToken = generateEmailVerificationToken(payload.id, payload.email);
    expect(() => verifyPasswordResetToken(verifyToken)).toThrow('Invalid reset link');
  });

  it('reports an expired reset token distinctly from an invalid one', () => {
    const expired = jwt.sign(
      { id: payload.id, email: payload.email, purpose: 'password_reset' },
      process.env.JWT_SECRET || 'dev-secret',
      { expiresIn: -10, algorithm: 'HS256' },
    );
    expect(() => verifyPasswordResetToken(expired)).toThrow('Reset link expired');
  });
});
