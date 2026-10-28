import { Request, Response } from 'express';
import { AuthService } from '../services/authService';
import { AuthenticatedRequest } from '../middleware/auth';
import { UnauthorizedError } from '../utils/errors';

export class AuthController {
  constructor(private readonly authService: AuthService) {}

  register = async (req: Request, res: Response): Promise<void> => {
    const { email, password, fullName, role } = req.body;
    const result = await this.authService.register({ email, password, fullName, role });
    res.status(201).json(result);
  };

  login = async (req: Request, res: Response): Promise<void> => {
    const { email, password } = req.body;
    const result = await this.authService.login({ email, password });
    res.status(200).json(result);
  };

  me = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!req.user) {
      throw new UnauthorizedError();
    }
    const user = await this.authService.getCurrentUser(req.user.sub);
    res.status(200).json({ user });
  };

  refresh = async (req: Request, res: Response): Promise<void> => {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      throw new UnauthorizedError('Missing refresh token');
    }
    const tokens = await this.authService.refresh(refreshToken);
    res.status(200).json({ tokens });
  };

  logout = async (_req: Request, res: Response): Promise<void> => {
    res.status(200).json({ message: 'Logged out' });
  };
}
