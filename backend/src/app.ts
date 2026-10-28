import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { config } from '@config/environment';
import authRoutes from '@routes/auth.routes';
import serviceRoutes from '@routes/services.routes';
import bookingRoutes from '@routes/bookings.routes';
import reviewRoutes from '@routes/reviews.routes';
import messageRoutes from '@routes/messages.routes';
import paymentRoutes from '@routes/payments.routes';
import providerRoutes from '@routes/providers.routes';
import adminRoutes from '@routes/admin.routes';
import disputeRoutes from '@routes/disputes.routes';
import notificationRoutes from '@routes/notifications.routes';
import favoriteRoutes from '@routes/favorites.routes';
import promoRoutes from '@routes/promos.routes';
import uploadRoutes from '@routes/uploads.routes';
import { UPLOAD_DIR } from '@config/upload';
import { PaymentController } from '@controllers/paymentController';

const app = express();

// ===== MIDDLEWARE =====

// Security
app.use(helmet());

// Compression
app.use(compression());

// CORS
app.use(cors({
  origin: config.frontend_url,
  credentials: true,
}));

// Request logging
app.use(morgan('combined'));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Tighter limit on auth endpoints specifically — the global limiter alone
// leaves login/register/forgot-password only as constrained as every other
// route's shared budget, which isn't enough to slow credential stuffing or
// email-enumeration attempts.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many attempts, please try again later' },
});
app.use('/api/v1/auth/login', authLimiter);
app.use('/api/v1/auth/register', authLimiter);
app.use('/api/v1/auth/forgot-password', authLimiter);
app.use('/api/v1/auth/reset-password', authLimiter);
app.use('/api/v1/auth/resend-verification', authLimiter);

// Stripe webhook — must be mounted with the raw body BEFORE express.json(),
// since signature verification needs the exact original request bytes.
app.post(
  '/api/v1/payments/webhook',
  express.raw({ type: 'application/json' }),
  PaymentController.handleWebhook
);

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ===== ROUTES =====

app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/services', serviceRoutes);
app.use('/api/v1/bookings', bookingRoutes);
app.use('/api/v1/reviews', reviewRoutes);
app.use('/api/v1/messages', messageRoutes);
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1/providers', providerRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/disputes', disputeRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/favorites', favoriteRoutes);
app.use('/api/v1/promos', promoRoutes);
app.use('/api/v1/uploads', uploadRoutes);
app.use('/uploads', express.static(UPLOAD_DIR));

// ===== ERROR HANDLING =====

app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Route not found' });
});

app.use((error: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled error:', error);

  if (error.name === 'ValidationError') {
    return res.status(400).json({ error: error.message });
  }

  res.status(error.status || 500).json({
    error: error.message || 'Internal server error',
  });
});

export default app;
