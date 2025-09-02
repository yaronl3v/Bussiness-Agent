// Sequelize CLI configuration (CommonJS to avoid ESM issues with CLI)
// Uses PG_DATABASE_URL for all environments.

require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const databaseUrl = process.env.PG_DATABASE_URL;

if (!databaseUrl) {
  throw new Error('PG_DATABASE_URL is not set. Please configure your environment.');
}

module.exports = {
  development: {
    use_env_variable: 'PG_DATABASE_URL',
    url: databaseUrl,
    dialect: 'postgres',
    dialectOptions: {},
    migrationStorageTableName: 'sequelize_meta'
  },
  test: {
    use_env_variable: 'PG_DATABASE_URL',
    url: databaseUrl,
    dialect: 'postgres',
    dialectOptions: {},
    migrationStorageTableName: 'sequelize_meta'
  },
  production: {
    use_env_variable: 'PG_DATABASE_URL',
    url: databaseUrl,
    dialect: 'postgres',
    dialectOptions: {},
    migrationStorageTableName: 'sequelize_meta'
  }
};


