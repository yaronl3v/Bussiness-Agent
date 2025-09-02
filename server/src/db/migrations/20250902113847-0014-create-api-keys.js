'use strict';

/** @type {import('sequelize-cli').Migration} */
export default {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('api_keys', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.literal('uuid_generate_v4()'), primaryKey: true },
      agent_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'agents', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
      provider: { type: Sequelize.STRING(100), allowNull: false },
      key_ref: { type: Sequelize.STRING(255), allowNull: false },
      created_at: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
    });
    await queryInterface.addIndex('api_keys', ['agent_id']);
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('api_keys');
  }
};
