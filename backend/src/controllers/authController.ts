import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { AuthService } from '@services/authService';
import { verifyRefreshToken, generateAccessToken } from '@utils/jwt';

export class AuthController {
  static async register(req: Request, res: Response) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { email, password, first_name, last_name } = req.body;

      const result = await AuthService.register({
        email,
        password,
        first_name,
        last_name,
      });

      // Set refresh token in httpOnly cookie
      res.cookie('refreshToken', result.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      return res.status(201).json({
        message: 'User registered successfully',
        user: result.user,
        access_token: result.access_token,
        ...(result.dev_verify_link ? { dev_verify_link: result.dev_verify_link } : {}),
      });
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  static async login(req: Request, res: Response) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { email, password } = req.body;

      const result = await AuthService.login({ email, password });

      // Set refresh token in httpOnly cookie
      res.cookie('refreshToken', result.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      return res.status(200).json({
        message: 'Login successful',
        user: result.user,
        access_token: result.access_token,
      });
    } catch (error: any) {
      return res.status(401).json({ error: error.message });
    }
  }

  static async refreshToken(req: Request, res: Response) {
    try {
      const refreshToken = req.cookies.refreshToken || req.body.refresh_token;

      if (!refreshToken) {
        return res.status(401).json({ error: 'Refresh token not found' });
      }

      const payload = verifyRefreshToken(refreshToken);

      const newAccessToken = generateAccessToken({
        id: payload.id,
        email: payload.email,
        user_type: payload.user_type,
      });

      return res.status(200).json({
        access_token: newAccessToken,
      });
    } catch (error: any) {
      return res.status(401).json({ error: error.message });
    }
  }

  static async logout(req: Request, res: Response) {
    res.clearCookie('refreshToken');
    return res.status(200).json({ message: 'Logout successful' });
  }

  static async getCurrentUser(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const user = await AuthService.getCurrentUser(req.user.id);

      return res.status(200).json({ user });
    } catch (error: any) {
      return res.status(404).json({ error: error.message });
    }
  }

  static async updateProfile(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const { first_name, last_name, phone, bio, avatar_url } = req.body;
      const user = await AuthService.updateProfile(req.user.id, {
        first_name,
        last_name,
        phone,
        bio,
        avatar_url,
      });

      return res.status(200).json({ message: 'Profile updated', user });
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  static async forgotPassword(req: Request, res: Response) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { email } = req.body;
      const result = await AuthService.forgotPassword(email);

      // Same generic message whether or not the account exists.
      return res.status(200).json({
        message: 'If an account exists for that email, a reset link has been sent.',
        ...result,
      });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async resetPassword(req: Request, res: Response) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { token, password } = req.body;
      await AuthService.resetPassword(token, password);

      return res.status(200).json({ message: 'Password reset successfully' });
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  static async verifyEmail(req: Request, res: Response) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { token } = req.body;
      await AuthService.verifyEmail(token);
      return res.status(200).json({ message: 'Email verified successfully' });
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  static async savePushToken(req: Request, res: Response) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
      const { push_token } = req.body;

      await AuthService.savePushToken(req.user.id, push_token);
      return res.status(200).json({ message: 'Push token saved' });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async resendVerification(req: Request, res: Response) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { email } = req.body;
      const result = await AuthService.resendVerificationEmail(email);
      return res.status(200).json({
        message: 'If an account exists for that email and is not yet verified, a verification link has been sent.',
        ...result,
      });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }
}
