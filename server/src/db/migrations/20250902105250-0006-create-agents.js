/** @type {import('sequelize-cli').Migration} */
export default {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('agents', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('uuid_generate_v4()'),
        primaryKey: true
      },
      org_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'organizations', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      name: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      status: {
        type: Sequelize.ENUM('active', 'disabled'),
        allowNull: false,
        defaultValue: 'disabled'
      },
      welcome_message: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      special_instructions: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      lead_form_schema_jsonb: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: {}
      },
      dynamic_info_schema_jsonb: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: {}
      },
      modules_jsonb: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: {}
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });
    await queryInterface.addIndex('agents', ['org_id']);
    await queryInterface.addIndex('agents', ['org_id', 'name'], { unique: true, name: 'agents_org_name_unique' });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('agents');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_agents_status";');
  }
};
