import jwt from 'jsonwebtoken';
import { config } from '@config/environment';

export interface TokenPayload {
  id: string;
  email: string;
  user_type: string;
}

export function generateAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiry,
    algorithm: 'HS256',
  });
}

export function generateRefreshToken(payload: TokenPayload): string {
  return jwt.sign(payload, config.jwt.refresh_secret, {
    expiresIn: config.jwt.refresh_expiry,
    algorithm: 'HS256',
  });
}

export function verifyAccessToken(token: string): TokenPayload {
  try {
    return jwt.verify(token, config.jwt.secret) as TokenPayload;
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Access token expired');
    }
    throw new Error('Invalid access token');
  }
}

export function verifyRefreshToken(token: string): TokenPayload {
  try {
    return jwt.verify(token, config.jwt.refresh_secret) as TokenPayload;
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Refresh token expired');
    }
    throw new Error('Invalid refresh token');
  }
}

export function decodeToken(token: string): TokenPayload | null {
  return jwt.decode(token) as TokenPayload | null;
}

interface PasswordResetPayload {
  id: string;
  email: string;
  purpose: 'password_reset';
  iat: number;
}

// Short-lived, purpose-scoped so a leaked reset link can't be replayed as a
// login token and a leaked access token can't be used to reset a password.
export function generatePasswordResetToken(id: string, email: string): string {
  return jwt.sign({ id, email, purpose: 'password_reset' }, config.jwt.secret, {
    expiresIn: '30m',
    algorithm: 'HS256',
  });
}

export function verifyPasswordResetToken(token: string): PasswordResetPayload {
  let payload: PasswordResetPayload;
  try {
    payload = jwt.verify(token, config.jwt.secret) as PasswordResetPayload;
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Reset link expired — request a new one');
    }
    throw new Error('Invalid reset link');
  }
  if (payload.purpose !== 'password_reset') {
    throw new Error('Invalid reset link');
  }
  return payload;
}

interface EmailVerificationPayload {
  id: string;
  email: string;
  purpose: 'email_verification';
}

// 24h validity — long-lived relative to the password-reset token since a
// verification email sitting unread in an inbox for a day is normal, and
// re-verifying doesn't unlock anything sensitive the way a password does.
export function generateEmailVerificationToken(id: string, email: string): string {
  return jwt.sign({ id, email, purpose: 'email_verification' }, config.jwt.secret, {
    expiresIn: '24h',
    algorithm: 'HS256',
  });
}

export function verifyEmailVerificationToken(token: string): EmailVerificationPayload {
  let payload: EmailVerificationPayload;
  try {
    payload = jwt.verify(token, config.jwt.secret) as EmailVerificationPayload;
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Verification link expired — request a new one');
    }
    throw new Error('Invalid verification link');
  }
  if (payload.purpose !== 'email_verification') {
    throw new Error('Invalid verification link');
  }
  return payload;
}
