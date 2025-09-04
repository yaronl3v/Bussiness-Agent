/** @type {import('sequelize-cli').Migration} */
export async function up(queryInterface, Sequelize) {
  await queryInterface.addColumn('agents', 'dynamic_info_schema_natural_text', {
    type: Sequelize.TEXT,
    allowNull: true
  });
}

/** @type {import('sequelize-cli').Migration} */
export async function down(queryInterface, Sequelize) {
  await queryInterface.removeColumn('agents', 'dynamic_info_schema_natural_text');
}

