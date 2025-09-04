import app from './app.js';

import { testConnection, ensureOptionalColumns } from './db/sequelize.js';

// Test database connection before starting server
const startServer = async () => {
  try {
    // Test database connection
    const dbConnected = await testConnection();
      if (!dbConnected) {
        console.error('Failed to connect to database. Exiting...');
        process.exit(1);
      }

    // Ensure optional columns exist (safe idempotent DDL)
    await ensureOptionalColumns();

    // Start HTTP server
    const port = process.env.PORT || 3000;
    const server = app.listen(port, () => {
        console.log(`Server running on port ${port} in ${process.env.NODE_ENV || 'development'} mode`);
        console.log(`Health check available at /health`);
    });

    // Graceful shutdown
      const gracefulShutdown = (signal) => {
        console.log(`${signal} received. Shutting down gracefully...`);
        server.close(() => {
          console.log('HTTP server closed');
          process.exit(0);
        });
      };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  } catch (error) {
    console.error('Failed to start server', error);
    process.exit(1);
  }
};

startServer();
