import { config } from '@config/environment';
import { initializeDatabase, closePool } from '@config/database';
import app from '@/app';

const server = app.listen(config.port, async () => {
  try {
    // Initialize database
    await initializeDatabase();

    console.log(`✓ ServiceHub API server running on port ${config.port}`);
    console.log(`✓ Environment: ${config.node_env}`);
    console.log(`✓ Base URL: ${config.api_base_url}`);
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(async () => {
    console.log('HTTP server closed');
    await closePool();
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  console.log('SIGINT signal received: closing HTTP server');
  server.close(async () => {
    console.log('HTTP server closed');
    await closePool();
    process.exit(0);
  });
});
