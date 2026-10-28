import { query } from '@config/database';
import { hashPassword, comparePassword } from '@utils/passwordHash';
import {
  generateAccessToken,
  generateRefreshToken,
  generatePasswordResetToken,
  verifyPasswordResetToken,
  generateEmailVerificationToken,
  verifyEmailVerificationToken,
} from '@utils/jwt';
import { config } from '@config/environment';
import { EmailService } from '@services/emailService';
import { v4 as uuidv4 } from 'uuid';

interface RegisterPayload {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
}

interface LoginPayload {
  email: string;
  password: string;
}

interface AuthResponse {
  user: {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    user_type: string;
  };
  access_token: string;
  refresh_token: string;
  dev_verify_link?: string;
}

export class AuthService {
  static async register(payload: RegisterPayload): Promise<AuthResponse> {
    // Check if email already exists
    const existingUser = await query(
      'SELECT id FROM users WHERE email = $1',
      [payload.email]
    );

    if (existingUser.rows.length > 0) {
      throw new Error('Email already registered');
    }

    // Hash password
    const password_hash = await hashPassword(payload.password);

    // Create user
    const userId = uuidv4();
    const result = await query(
      `INSERT INTO users (id, email, password_hash, first_name, last_name, user_type)
       VALUES ($1, $2, $3, $4, $5, 'customer')
       RETURNING id, email, first_name, last_name, user_type`,
      [userId, payload.email, password_hash, payload.first_name, payload.last_name]
    );

    const user = result.rows[0];

    // Generate tokens
    const access_token = generateAccessToken({
      id: user.id,
      email: user.email,
      user_type: user.user_type,
    });

    const refresh_token = generateRefreshToken({
      id: user.id,
      email: user.email,
      user_type: user.user_type,
    });

    const verifyToken = generateEmailVerificationToken(user.id, user.email);
    const verifyLink = `${config.frontend_url}/verify-email?token=${verifyToken}`;
    // Don't let a slow/broken SMTP provider fail registration itself.
    EmailService.send(
      user.email,
      'Verify your ServiceHub email',
      `<p>Welcome to ServiceHub! Please verify your email address:</p><p><a href="${verifyLink}">${verifyLink}</a></p><p>This link expires in 24 hours.</p>`
    ).catch(() => {});

    return {
      user,
      access_token,
      refresh_token,
      ...(config.node_env !== 'production' ? { dev_verify_link: verifyLink } : {}),
    };
  }

  static async login(payload: LoginPayload): Promise<AuthResponse> {
    // Find user by email
    const result = await query(
      'SELECT id, email, password_hash, first_name, last_name, user_type FROM users WHERE email = $1',
      [payload.email]
    );

    if (result.rows.length === 0) {
      throw new Error('Invalid email or password');
    }

    const user = result.rows[0];

    // Compare password
    const isPasswordValid = await comparePassword(payload.password, user.password_hash);

    if (!isPasswordValid) {
      throw new Error('Invalid email or password');
    }

    // Generate tokens
    const access_token = generateAccessToken({
      id: user.id,
      email: user.email,
      user_type: user.user_type,
    });

    const refresh_token = generateRefreshToken({
      id: user.id,
      email: user.email,
      user_type: user.user_type,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        user_type: user.user_type,
      },
      access_token,
      refresh_token,
    };
  }

  static async getCurrentUser(userId: string) {
    const result = await query(
      'SELECT id, email, first_name, last_name, phone, avatar_url, bio, user_type, verified_email FROM users WHERE id = $1 AND deleted_at IS NULL',
      [userId]
    );

    if (result.rows.length === 0) {
      throw new Error('User not found');
    }

    return result.rows[0];
  }

  static async updateProfile(
    userId: string,
    updates: Partial<{ first_name: string; last_name: string; phone: string; bio: string; avatar_url: string }>
  ) {
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) {
        fields.push(`${key} = $${paramIndex++}`);
        values.push(value);
      }
    }

    if (fields.length === 0) {
      throw new Error('No fields to update');
    }

    fields.push(`updated_at = NOW()`);
    values.push(userId);

    const result = await query(
      `UPDATE users SET ${fields.join(', ')} WHERE id = $${paramIndex} AND deleted_at IS NULL
       RETURNING id, email, first_name, last_name, phone, avatar_url, bio, user_type, verified_email`,
      values
    );

    if (result.rows.length === 0) {
      throw new Error('User not found');
    }

    return result.rows[0];
  }

  // Deliberately never reveals whether the email exists — the caller always
  // gets a generic success message regardless. `dev_reset_link` is only
  // populated outside production (as a fallback for when SMTP isn't
  // configured in dev); in production the link only ever goes out by email.
  static async forgotPassword(email: string): Promise<{ dev_reset_link?: string }> {
    const result = await query(
      'SELECT id, email FROM users WHERE email = $1 AND deleted_at IS NULL',
      [email]
    );

    if (result.rows.length === 0) {
      return {};
    }

    const user = result.rows[0];
    const token = generatePasswordResetToken(user.id, user.email);
    const resetLink = `${config.frontend_url}/reset-password?token=${token}`;

    const sent = await EmailService.send(
      email,
      'Reset your ServiceHub password',
      `<p>We received a request to reset your password.</p><p><a href="${resetLink}">${resetLink}</a></p><p>This link expires in 30 minutes and can only be used once. If you didn't request this, you can ignore this email.</p>`
    );
    if (!sent) console.log(`[password reset] ${email} -> ${resetLink}`);

    if (config.node_env === 'production') {
      return {};
    }
    return { dev_reset_link: resetLink };
  }

  static async savePushToken(userId: string, pushToken: string): Promise<void> {
    await query('UPDATE users SET push_token = $1, updated_at = NOW() WHERE id = $2', [pushToken, userId]);
  }

  static async verifyEmail(token: string): Promise<void> {
    const payload = verifyEmailVerificationToken(token);

    const result = await query(
      `UPDATE users SET verified_email = true, updated_at = NOW()
       WHERE id = $1 AND email = $2 AND deleted_at IS NULL RETURNING id`,
      [payload.id, payload.email]
    );

    if (result.rows.length === 0) {
      throw new Error('User not found');
    }
  }

  // Same generic-response shape as forgotPassword — never reveals whether
  // the account exists or is already verified.
  static async resendVerificationEmail(email: string): Promise<{ dev_verify_link?: string }> {
    const result = await query(
      'SELECT id, email, verified_email FROM users WHERE email = $1 AND deleted_at IS NULL',
      [email]
    );

    if (result.rows.length === 0 || result.rows[0].verified_email) {
      return {};
    }

    const user = result.rows[0];
    const token = generateEmailVerificationToken(user.id, user.email);
    const verifyLink = `${config.frontend_url}/verify-email?token=${token}`;

    const sent = await EmailService.send(
      email,
      'Verify your ServiceHub email',
      `<p>Please verify your email address:</p><p><a href="${verifyLink}">${verifyLink}</a></p><p>This link expires in 24 hours.</p>`
    );
    if (!sent) console.log(`[email verification] ${email} -> ${verifyLink}`);

    if (config.node_env === 'production') {
      return {};
    }
    return { dev_verify_link: verifyLink };
  }

  static async resetPassword(token: string, newPassword: string): Promise<void> {
    const payload = verifyPasswordResetToken(token);

    const userResult = await query(
      'SELECT password_changed_at FROM users WHERE id = $1 AND email = $2 AND deleted_at IS NULL',
      [payload.id, payload.email]
    );

    if (userResult.rows.length === 0) {
      throw new Error('User not found');
    }

    // A reset token is a stateless JWT with no server-side revocation list, so
    // "single use" is enforced by comparing the token's issue time against the
    // last time the password actually changed — any token issued before that
    // moment is treated as already spent, blocking replay of the same link.
    // JWT `iat` has whole-second precision while password_changed_at keeps
    // milliseconds, so both sides are compared at second granularity to avoid
    // rejecting a legitimate token issued in the same second as the last change.
    const passwordChangedAtSec = Math.floor(
      new Date(userResult.rows[0].password_changed_at).getTime() / 1000
    );
    if (payload.iat < passwordChangedAtSec) {
      throw new Error('This reset link has already been used — request a new one');
    }

    const password_hash = await hashPassword(newPassword);

    // Bump password_changed_at to strictly after this token's iat second (not
    // just NOW()) so replaying this same token immediately afterward always
    // fails the check above, even if both fall within the same wall-clock second.
    const result = await query(
      `UPDATE users SET password_hash = $1, password_changed_at = GREATEST(NOW(), to_timestamp($4)), updated_at = NOW()
       WHERE id = $2 AND email = $3 AND deleted_at IS NULL RETURNING id`,
      [password_hash, payload.id, payload.email, payload.iat + 1]
    );

    if (result.rows.length === 0) {
      throw new Error('User not found');
    }
  }
}
