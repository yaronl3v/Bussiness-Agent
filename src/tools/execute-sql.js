import { Client } from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from server/.env
dotenv.config({ path: path.join(__dirname, '../../server/.env') });

const executeSQL = async (sqlCommand) => {
  const client = new Client({
    connectionString: process.env.PG_DATABASE_URL,
  });

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

// Get SQL command from command line arguments
const sqlCommand = process.argv[2];

if (!sqlCommand) {
  console.error('Usage: node src/tools/execute-sql.js "YOUR SQL COMMAND"');
  console.error('Example: node src/tools/execute-sql.js "SELECT * FROM users LIMIT 5;"');
  process.exit(1);
}

if (!process.env.PG_DATABASE_URL) {
  console.error('Error: PG_DATABASE_URL environment variable is not set');
  process.exit(1);
}

executeSQL(sqlCommand);
