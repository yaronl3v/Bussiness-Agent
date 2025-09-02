/** @type {import('sequelize-cli').Migration} */
export default {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('conversations', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.literal('uuid_generate_v4()'), primaryKey: true },
      agent_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'agents', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'CASCADE'
      },
      client_id: { type: Sequelize.STRING(255), allowNull: false },
      channel: { type: Sequelize.STRING(50), allowNull: false, defaultValue: 'inapp' },
      meta_jsonb: { type: Sequelize.JSONB, allowNull: false, defaultValue: {} },
      created_at: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
    });
    await queryInterface.addIndex('conversations', ['agent_id', 'client_id'], { name: 'conversations_agent_client_idx' });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('conversations');
  }
};
