import { DataTypes } from 'sequelize';

export async function up(queryInterface) {
  await queryInterface.addColumn('agents', 'chat_flow_jsonb', {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: ['DYNAMIC_INFO_SCHEMA_STATE', 'POST_COLLECTION_INFORMATION', 'LEAD_SCHEMA_STATE']
  });
}

export async function down(queryInterface) {
  await queryInterface.removeColumn('agents', 'chat_flow_jsonb');
}

export default { up, down };
