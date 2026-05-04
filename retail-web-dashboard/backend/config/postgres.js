const { Pool } = require('pg');
const path = require('path');
const fs = require('fs');

// Load environment variables from parent directory (.env) or current directory
const parentEnvPath = path.resolve(__dirname, '../../.env');
const currentEnvPath = path.resolve(__dirname, '../.env');

if (fs.existsSync(parentEnvPath)) {
  require('dotenv').config({ path: parentEnvPath });
} else if (fs.existsSync(currentEnvPath)) {
  require('dotenv').config({ path: currentEnvPath });
}

const pool = new Pool({
  host: process.env.POSTGRES_HOST,
  port: process.env.POSTGRES_PORT || 5432,
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DATABASE,
  ssl: process.env.POSTGRES_SSL === 'true' ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  query_timeout: 30000,
});

async function executeQuery(query, params = []) {
  const client = await pool.connect();
  try {
    const result = await client.query(query, params);
    return result.rows;
  } catch (error) {
    console.error('Error executing query:', error);
    throw error;
  } finally {
    client.release();
  }
}

async function closeConnection() {
  await pool.end();
}

module.exports = {
  executeQuery,
  closeConnection
};
