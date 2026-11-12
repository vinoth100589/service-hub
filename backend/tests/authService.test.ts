jest.mock('@config/database', () => ({
  query: jest.fn(),
}));

jest.mock('@services/emailService', () => ({
  EmailService: { send: jest.fn().mockResolvedValue(true) },
}));

import { query } from '@config/database';
import { EmailService } from '@services/emailService';
import { hashPassword } from '@utils/passwordHash';
import { generatePasswordResetToken, generateEmailVerificationToken } from '@utils/jwt';
import { AuthService } from '../src/services/authService';

const mockQuery = query as jest.Mock;

beforeEach(() => {
  mockQuery.mockReset();
  (EmailService.send as jest.Mock).mockClear();
});

describe('AuthService.register', () => {
  it('rejects an email that is already registered', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ id: 'existing-user' }] });

    await expect(
      AuthService.register({
        email: 'jane@example.com',
        password: 'password123',
        first_name: 'Jane',
        last_name: 'Doe',
      })
    ).rejects.toThrow('Email already registered');

    expect(mockQuery).toHaveBeenCalledTimes(1);
  });

  it('creates the user with a bcrypt hash (not the plaintext password) and returns tokens', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] }); // email not taken
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: 'user-1', email: 'jane@example.com', first_name: 'Jane', last_name: 'Doe', user_type: 'customer' }],
    });

    const result = await AuthService.register({
      email: 'jane@example.com',
      password: 'password123',
      first_name: 'Jane',
      last_name: 'Doe',
    });

    const insertCall = mockQuery.mock.calls[1];
    const insertedHash = insertCall[1][2];
    expect(insertedHash).not.toBe('password123');
    expect(insertedHash).toMatch(/^\$2[aby]\$/); // bcrypt hash format

    expect(result.user.email).toBe('jane@example.com');
    expect(result.access_token).toBeTruthy();
    expect(result.refresh_token).toBeTruthy();
    expect(result.dev_verify_link).toContain('/verify-email?token=');
  });

  it('fires the verification email without letting a send failure fail registration', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: 'user-1', email: 'jane@example.com', first_name: 'Jane', last_name: 'Doe', user_type: 'customer' }],
    });
    (EmailService.send as jest.Mock).mockRejectedValueOnce(new Error('SMTP down'));

    await expect(
      AuthService.register({
        email: 'jane@example.com',
        password: 'password123',
        first_name: 'Jane',
        last_name: 'Doe',
      })
    ).resolves.toBeTruthy();
  });
});

describe('AuthService.login', () => {
  it('rejects an unknown email without revealing that the account does not exist', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    await expect(AuthService.login({ email: 'nobody@example.com', password: 'x' })).rejects.toThrow(
      'Invalid email or password'
    );
  });

  it('rejects a wrong password with the same generic message', async () => {
    const password_hash = await hashPassword('correct-password');
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: 'user-1', email: 'jane@example.com', password_hash, first_name: 'Jane', last_name: 'Doe', user_type: 'customer' }],
    });

    await expect(AuthService.login({ email: 'jane@example.com', password: 'wrong' })).rejects.toThrow(
      'Invalid email or password'
    );
  });

  it('logs in successfully with the correct password', async () => {
    const password_hash = await hashPassword('correct-password');
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: 'user-1', email: 'jane@example.com', password_hash, first_name: 'Jane', last_name: 'Doe', user_type: 'customer' }],
    });

    const result = await AuthService.login({ email: 'jane@example.com', password: 'correct-password' });

    expect(result.user.id).toBe('user-1');
    expect(result.access_token).toBeTruthy();
    // password_hash must never leak back out through the response
    expect((result.user as any).password_hash).toBeUndefined();
  });
});

describe('AuthService.resetPassword', () => {
  it('rejects a reset token for a user that no longer exists', async () => {
    const token = generatePasswordResetToken('user-1', 'jane@example.com');
    mockQuery.mockResolvedValueOnce({ rows: [] });

    await expect(AuthService.resetPassword(token, 'newpassword123')).rejects.toThrow('User not found');
  });

  it('accepts a fresh token for a user who has never changed their password', async () => {
    const token = generatePasswordResetToken('user-1', 'jane@example.com');
    mockQuery.mockResolvedValueOnce({ rows: [{ password_changed_at: null }] });
    mockQuery.mockResolvedValueOnce({ rows: [{ id: 'user-1' }] });

    await expect(AuthService.resetPassword(token, 'newpassword123')).resolves.toBeUndefined();
  });

  it('rejects replaying the same reset link after it has already been used', async () => {
    // Regression coverage: single-use is enforced by comparing the token's
    // iat against password_changed_at — a token issued *before* the most
    // recent password change must be treated as already spent.
    const token = generatePasswordResetToken('user-1', 'jane@example.com');
    const changedAfterTokenIssued = new Date(Date.now() + 5000); // 5s in the future
    mockQuery.mockResolvedValueOnce({ rows: [{ password_changed_at: changedAfterTokenIssued.toISOString() }] });

    await expect(AuthService.resetPassword(token, 'newpassword123')).rejects.toThrow(
      'This reset link has already been used'
    );
  });
});

describe('AuthService.verifyEmail', () => {
  it('marks the email verified for a matching, unexpired token', async () => {
    const token = generateEmailVerificationToken('user-1', 'jane@example.com');
    mockQuery.mockResolvedValueOnce({ rows: [{ id: 'user-1' }] });

    await expect(AuthService.verifyEmail(token)).resolves.toBeUndefined();
    expect(mockQuery.mock.calls[0][1]).toEqual(['user-1', 'jane@example.com']);
  });

  it('throws when no matching, non-deleted user is found', async () => {
    const token = generateEmailVerificationToken('user-1', 'jane@example.com');
    mockQuery.mockResolvedValueOnce({ rows: [] });

    await expect(AuthService.verifyEmail(token)).rejects.toThrow('User not found');
  });
});

describe('AuthService.forgotPassword / resendVerificationEmail', () => {
  it('returns a generic empty result for an email that does not exist (forgotPassword)', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    const result = await AuthService.forgotPassword('nobody@example.com');

    expect(result).toEqual({});
    expect(EmailService.send).not.toHaveBeenCalled();
  });

  it('sends a reset email and returns a dev link outside production (forgotPassword)', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ id: 'user-1', email: 'jane@example.com' }] });

    const result = await AuthService.forgotPassword('jane@example.com');

    expect(EmailService.send).toHaveBeenCalledTimes(1);
    expect(result.dev_reset_link).toContain('/reset-password?token=');
  });

  it('does not send a verification email if the account is already verified', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ id: 'user-1', email: 'jane@example.com', verified_email: true }] });

    const result = await AuthService.resendVerificationEmail('jane@example.com');

    expect(result).toEqual({});
    expect(EmailService.send).not.toHaveBeenCalled();
  });
});
