import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '@utils/jwt';

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid authorization header' });
  }

  const token = authHeader.slice(7);

  try {
    const payload = verifyAccessToken(token);
    req.user = {
      id: payload.id,
      email: payload.email,
      user_type: payload.user_type,
    };
    next();
  } catch (error: any) {
    return res.status(401).json({ error: error.message });
  }
}

export function optionalAuthMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    try {
      const payload = verifyAccessToken(token);
      req.user = {
        id: payload.id,
        email: payload.email,
        user_type: payload.user_type,
      };
    } catch (error) {
      // Silently ignore invalid token
    }
  }

  next();
}

export function adminOnlyMiddleware(req: Request, res: Response, next: NextFunction) {
  if (!req.user || req.user.user_type !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

export function providerOnlyMiddleware(req: Request, res: Response, next: NextFunction) {
  if (!req.user || (req.user.user_type !== 'provider' && req.user.user_type !== 'admin')) {
    return res.status(403).json({ error: 'Provider access required' });
  }
  next();
}
