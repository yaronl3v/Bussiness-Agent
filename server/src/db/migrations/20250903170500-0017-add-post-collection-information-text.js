/** @type {import('sequelize-cli').Migration} */
export async function up(queryInterface, Sequelize) {
  await queryInterface.addColumn('agents', 'post_collection_information_text', {
    type: Sequelize.TEXT,
    allowNull: true
  });
}

/** @type {import('sequelize-cli').Migration} */
export async function down(queryInterface, Sequelize) {
  await queryInterface.removeColumn('agents', 'post_collection_information_text');
}

