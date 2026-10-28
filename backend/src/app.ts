import express, { Express } from 'express';
import cors from 'cors';
import { Pool } from 'pg';
import { createAuthRouter } from './routes/authRoutes';
import { AuthController } from './controllers/authController';
import { AuthService } from './services/authService';
import { InMemoryUserRepository, PostgresUserRepository, UserRepository } from './repositories/userRepository';
import { errorHandler } from './middleware/errorHandler';

export function createApp(pool?: Pool): Express {
  const app = express();

  app.use(cors());
  app.use(express.json());

  const userRepository: UserRepository = pool
    ? new PostgresUserRepository(pool)
    : new InMemoryUserRepository();
  const authService = new AuthService(userRepository);
  const authController = new AuthController(authService);

  app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok' });
  });

  app.use('/api/v1/auth', createAuthRouter(authController));

  app.use(errorHandler);

  return app;
}
