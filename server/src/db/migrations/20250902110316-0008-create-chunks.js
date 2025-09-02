/** @type {import('sequelize-cli').Migration} */
export default {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('chunks', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('uuid_generate_v4()'),
        primaryKey: true
      },
      document_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'documents', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      agent_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'agents', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      content: { type: Sequelize.TEXT, allowNull: false },
      position_jsonb: { type: Sequelize.JSONB, allowNull: false, defaultValue: {} },
      embedding: { type: 'vector(1536)', allowNull: true },
      created_at: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
    });
    await queryInterface.addIndex('chunks', ['agent_id']);
    await queryInterface.sequelize.query('CREATE INDEX IF NOT EXISTS chunks_embedding_ivfflat ON chunks USING ivfflat (embedding vector_l2_ops) WITH (lists = 100);');
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('chunks');
  }
};
