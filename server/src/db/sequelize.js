// Load environment variables first
import '../env.js';

import { Sequelize } from 'sequelize';
import { logger } from '../config/logger.js';

// Initialize Sequelize with PostgreSQL
const databaseUrl = process.env.PG_DATABASE_URL;

if (!databaseUrl) {
  logger.error('PG_DATABASE_URL environment variable is not set. Please check your .env file.');
  process.exit(1);
}

const sequelize = new Sequelize(databaseUrl, {
  dialect: 'postgres',
  logging: (msg) => {
    if (process.env.NODE_ENV === 'development') {
      logger.debug('DB Query', { query: msg });
    }
  },
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000
  },
  define: {
    // Use snake_case for database columns
    underscored: true,
    // Add timestamps by default
    timestamps: true,
    // Use camelCase for model attributes
    freezeTableName: true
  }
});

// Test database connection
export const testConnection = async () => {
  try {
    await sequelize.authenticate();
    logger.info('Database connection established successfully');
    return true;
  } catch (error) {
    logger.error('Unable to connect to database', error);
    return false;
  }
};

// Sync database (use with caution in production)
export const syncDatabase = async (force = false) => {
  try {
    await sequelize.sync({ force });
    logger.info(`Database synchronized${force ? ' (forced)' : ''}`);
    return true;
  } catch (error) {
    logger.error('Database synchronization failed', error);
    return false;
  }
};

export default sequelize;
