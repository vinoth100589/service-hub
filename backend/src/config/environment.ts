import dotenv from 'dotenv';

dotenv.config();

export const config = {
  node_env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '5000'),
  api_base_url: process.env.API_BASE_URL || 'http://localhost:5000',

  database: {
    url: process.env.DATABASE_URL,
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    name: process.env.DB_NAME || 'servicehub',
    user: process.env.DB_USER || 'servicehub',
    password: process.env.DB_PASSWORD || 'servicehub_pass',
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'dev-secret',
    refresh_secret: process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret',
    expiry: process.env.JWT_EXPIRY || '15m',
    refresh_expiry: process.env.JWT_REFRESH_EXPIRY || '7d',
  },

  stripe: {
    secret_key: process.env.STRIPE_SECRET_KEY,
    public_key: process.env.STRIPE_PUBLIC_KEY,
    webhook_secret: process.env.STRIPE_WEBHOOK_SECRET,
  },

  email: {
    smtp_host: process.env.SMTP_HOST,
    smtp_port: parseInt(process.env.SMTP_PORT || '587'),
    smtp_user: process.env.SMTP_USER,
    smtp_password: process.env.SMTP_PASSWORD,
    from: process.env.EMAIL_FROM || 'noreply@servicehub.com',
  },

  google_maps_api_key: process.env.GOOGLE_MAPS_API_KEY,

  aws: {
    access_key_id: process.env.AWS_ACCESS_KEY_ID,
    secret_access_key: process.env.AWS_SECRET_ACCESS_KEY,
    s3_bucket: process.env.AWS_S3_BUCKET,
    region: process.env.AWS_REGION || 'us-east-1',
  },

  redis_url: process.env.REDIS_URL || 'redis://localhost:6379',

  frontend_url: process.env.FRONTEND_URL || 'http://localhost:3000',

  log_level: process.env.LOG_LEVEL || 'info',

  commission_rate: parseFloat(process.env.COMMISSION_RATE || '0.15'),
};

// Validate critical env vars in production
if (config.node_env === 'production') {
  const required = [
    'JWT_SECRET',
    'DATABASE_URL',
    'STRIPE_SECRET_KEY',
    'GOOGLE_MAPS_API_KEY',
  ];

  const missing = required.filter(key => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}
