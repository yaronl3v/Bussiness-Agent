/** @type {import('sequelize-cli').Migration} */
export default {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('invites', {
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
      email: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      inviter_user_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      token: {
        type: Sequelize.STRING(255),
        allowNull: false,
        unique: true
      },
      status: {
        type: Sequelize.ENUM('pending', 'accepted', 'revoked', 'expired'),
        allowNull: false,
        defaultValue: 'pending'
      },
      expires_at: {
        type: Sequelize.DATE,
        allowNull: true
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
    await queryInterface.addIndex('invites', ['org_id', 'email'], { name: 'invites_org_email_idx' });
    await queryInterface.addIndex('invites', ['token'], { unique: true, name: 'invites_token_idx' });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('invites');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_invites_status";');
  }
};
