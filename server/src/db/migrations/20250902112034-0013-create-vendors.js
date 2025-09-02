'use strict';

/** @type {import('sequelize-cli').Migration} */
export default {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('vendors', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.literal('uuid_generate_v4()'), primaryKey: true },
      agent_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'agents', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
      vendor_jsonb: { type: Sequelize.JSONB, allowNull: false, defaultValue: {} },
      status: { type: Sequelize.ENUM('active', 'inactive'), allowNull: false, defaultValue: 'active' },
      created_at: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
    });
    await queryInterface.addIndex('vendors', ['agent_id']);
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('vendors');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_vendors_status";');
  }
};
