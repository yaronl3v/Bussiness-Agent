'use strict';

/** @type {import('sequelize-cli').Migration} */
export default {
  async up (queryInterface, Sequelize) {
    await queryInterface.sequelize.query('CREATE EXTENSION IF NOT EXISTS pg_trgm;');
    // Add tsvector column for FTS
    await queryInterface.sequelize.query("ALTER TABLE chunks ADD COLUMN IF NOT EXISTS content_tsv tsvector;");
    await queryInterface.sequelize.query("UPDATE chunks SET content_tsv = to_tsvector('simple', coalesce(content,''));");
    await queryInterface.sequelize.query("CREATE INDEX IF NOT EXISTS chunks_content_tsv_idx ON chunks USING GIN (content_tsv);");
    await queryInterface.sequelize.query("CREATE INDEX IF NOT EXISTS chunks_content_trgm_idx ON chunks USING GIN (content gin_trgm_ops);");
    // Trigger to keep tsvector updated
    await queryInterface.sequelize.query("CREATE FUNCTION chunks_tsv_trigger() RETURNS trigger AS $$ begin new.content_tsv := to_tsvector('simple', coalesce(new.content,'')); return new; end $$ LANGUAGE plpgsql;");
    await queryInterface.sequelize.query("DROP TRIGGER IF EXISTS tsv_update ON chunks;");
    await queryInterface.sequelize.query("CREATE TRIGGER tsv_update BEFORE INSERT OR UPDATE ON chunks FOR EACH ROW EXECUTE FUNCTION chunks_tsv_trigger();");
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.sequelize.query('DROP TRIGGER IF EXISTS tsv_update ON chunks;');
    await queryInterface.sequelize.query('DROP FUNCTION IF EXISTS chunks_tsv_trigger;');
    await queryInterface.sequelize.query('DROP INDEX IF EXISTS chunks_content_tsv_idx;');
    await queryInterface.sequelize.query('DROP INDEX IF EXISTS chunks_content_trgm_idx;');
    await queryInterface.sequelize.query('ALTER TABLE chunks DROP COLUMN IF EXISTS content_tsv;');
    // leave pg_trgm extension installed
  }
};
