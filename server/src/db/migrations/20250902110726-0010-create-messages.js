/** @type {import('sequelize-cli').Migration} */
export default {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('messages', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.literal('uuid_generate_v4()'), primaryKey: true },
      conversation_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'conversations', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'CASCADE'
      },
      role: { type: Sequelize.ENUM('user', 'assistant', 'system'), allowNull: false },
      content_jsonb: { type: Sequelize.JSONB, allowNull: false, defaultValue: {} },
      citations_jsonb: { type: Sequelize.JSONB, allowNull: false, defaultValue: [] },
      created_at: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
    });
    await queryInterface.addIndex('messages', ['conversation_id']);
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('messages');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_messages_role";');
  }
};
