import { Pool } from 'pg';
import { createApp } from './app';
import { env } from './config/env';

const pool = env.databaseUrl ? new Pool({ connectionString: env.databaseUrl, max: 20 }) : undefined;

if (!pool) {
  console.warn('DATABASE_URL not set — running with an in-memory user store (not for production).');
}

const app = createApp(pool);

app.listen(env.port, () => {
  console.log(`ServiceHub API listening on port ${env.port}`);
});
