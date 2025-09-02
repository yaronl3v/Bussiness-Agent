'use strict';

/** @type {import('sequelize-cli').Migration} */
export default {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('leads', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.literal('uuid_generate_v4()'), primaryKey: true },
      agent_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'agents', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
      conversation_id: { type: Sequelize.UUID, allowNull: true, references: { model: 'conversations', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL' },
      lead_jsonb: { type: Sequelize.JSONB, allowNull: false, defaultValue: {} },
      status: { type: Sequelize.ENUM('new', 'qualified', 'contacted', 'converted', 'rejected'), allowNull: false, defaultValue: 'new' },
      created_at: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
    });
    await queryInterface.addIndex('leads', ['agent_id']);
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('leads');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_leads_status";');
  }
};
