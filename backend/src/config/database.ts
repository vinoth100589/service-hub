import { Pool, PoolClient } from 'pg';
import { config } from './environment';
import fs from 'fs';
import path from 'path';

const pool = new Pool({
  connectionString: config.database.url ||
    `postgresql://${config.database.user}:${config.database.password}@${config.database.host}:${config.database.port}/${config.database.name}`,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err: Error) => {
  console.error('Unexpected error on idle client', err);
});

export async function initializeDatabase() {
  const client = await pool.connect();
  try {
    console.log('Initializing database...');

    // Read and execute schema
    const schemaPath = path.join(__dirname, '../../../database/schema/tables.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    await client.query(schema);
    console.log('✓ Database schema initialized');

  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  } finally {
    client.release();
  }
}

export async function query(text: string, params?: any[]) {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    if (duration > 1000) {
      console.warn(`Slow query (${duration}ms): ${text.substring(0, 50)}...`);
    }
    return result;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

export async function getClient(): Promise<PoolClient> {
  return pool.connect();
}

export async function closePool() {
  await pool.end();
}

export default pool;
