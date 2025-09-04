// Load environment variables first
import '../env.js';

import { Sequelize } from 'sequelize';

// Initialize Sequelize with PostgreSQL
const databaseUrl = process.env.PG_DATABASE_URL;

if (!databaseUrl) {
  console.error('PG_DATABASE_URL environment variable is not set. Please check your .env file.');
  process.exit(1);
}

const sequelize = new Sequelize(databaseUrl, {
  dialect: 'postgres',
  logging: (msg) => {
      if (process.env.NODE_ENV === 'development') {
        console.log('DB Query', { query: msg });
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
    console.log('Database connection established successfully');
    return true;
  } catch (error) {
    console.error('Unable to connect to database', error);
    return false;
  }
};

// Ensure backward-compatible optional columns exist to prevent runtime errors
export const ensureOptionalColumns = async () => {
  try {
    // Add new columns if they are missing; safe to run multiple times
    await sequelize.query("ALTER TABLE agents ADD COLUMN IF NOT EXISTS dynamic_info_schema_natural_text TEXT;");
    await sequelize.query("ALTER TABLE agents ADD COLUMN IF NOT EXISTS post_collection_information_text TEXT;");
  } catch (error) {
    console.warn('Optional schema ensure failed', { error: error?.message });
  }
};

// Sync database (use with caution in production)
export const syncDatabase = async (force = false) => {
  try {
    await sequelize.sync({ force });
    console.log(`Database synchronized${force ? ' (forced)' : ''}`);
    return true;
  } catch (error) {
    console.error('Database synchronization failed', error);
    return false;
  }
};

export default sequelize;
