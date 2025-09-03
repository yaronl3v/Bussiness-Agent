import { Client } from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

const executeSQL = async (sqlCommand) => {
  const client = new Client({ connectionString: process.env.PG_DATABASE_URL });
  try {
    await client.connect();
    console.log('Connected to PostgreSQL database');
    const result = await client.query(sqlCommand);
    console.log('SQL executed successfully:');
    console.log('Command:', sqlCommand);
    if (result.rows && result.rows.length > 0) {
      console.log('Results:');
      console.table(result.rows);
    } else {
      console.log('No rows returned');
    }
    if (result.rowCount !== undefined) {
      console.log(`Rows affected: ${result.rowCount}`);
    }
  } catch (error) {
    console.error('Error executing SQL:', error.message);
    console.error('SQL Command:', sqlCommand);
    process.exit(1);
  } finally {
    await client.end();
    console.log('Database connection closed');
  }
};

const sqlCommand = process.argv[2];
if (!sqlCommand) {
  console.error('Usage: node server/src/tools/execute-sql.js "YOUR SQL COMMAND"');
  process.exit(1);
}

if (!process.env.PG_DATABASE_URL) {
  console.error('Error: PG_DATABASE_URL environment variable is not set');
  process.exit(1);
}

executeSQL(sqlCommand);


