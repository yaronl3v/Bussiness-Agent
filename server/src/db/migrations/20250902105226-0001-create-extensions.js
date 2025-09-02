/** @type {import('sequelize-cli').Migration} */
export default {
  async up (queryInterface, Sequelize) {
    // Required extensions
    await queryInterface.sequelize.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');
    await queryInterface.sequelize.query('CREATE EXTENSION IF NOT EXISTS vector;');
    // PostGIS optional for later
    // await queryInterface.sequelize.query('CREATE EXTENSION IF NOT EXISTS postgis;');
  },

  async down (queryInterface, Sequelize) {
    // Safe to leave extensions; but implement down for completeness
    await queryInterface.sequelize.query('DROP EXTENSION IF EXISTS vector;');
    await queryInterface.sequelize.query('DROP EXTENSION IF EXISTS "uuid-ossp";');
    // await queryInterface.sequelize.query('DROP EXTENSION IF EXISTS postgis;');
  }
};
