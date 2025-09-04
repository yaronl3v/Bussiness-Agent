import app from './app.js';

import { logger } from './config/logger.js';
import { testConnection, ensureOptionalColumns } from './db/sequelize.js';

// Test database connection before starting server
const startServer = async () => {
  try {
    // Test database connection
    const dbConnected = await testConnection();
    if (!dbConnected) {
      logger.error('Failed to connect to database. Exiting...');
      process.exit(1);
    }

    // Ensure optional columns exist (safe idempotent DDL)
    await ensureOptionalColumns();

    // Start HTTP server
    const port = process.env.PORT || 3000;
    const server = app.listen(port, () => {
      logger.info(`Server running on port ${port} in ${process.env.NODE_ENV || 'development'} mode`);
      logger.info(`Health check available at /health`);
    });

    // Graceful shutdown
    const gracefulShutdown = (signal) => {
      logger.info(`${signal} received. Shutting down gracefully...`);
      server.close(() => {
        logger.info('HTTP server closed');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  } catch (error) {
    logger.error('Failed to start server', error);
    process.exit(1);
  }
};

startServer();
