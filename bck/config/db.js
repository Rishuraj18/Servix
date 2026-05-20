const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config();

let pool;
let initPromise;

const baseConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  multipleStatements: true
};

const initializeDatabase = async () => {
  if (pool) return pool;

  const dbName = process.env.DB_NAME || 'servix_db';
  const setupConnection = await mysql.createConnection(baseConfig);

  await setupConnection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);

  if (process.env.DB_AUTO_SYNC !== 'false') {
    const schemaPath = path.join(__dirname, '..', 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    await setupConnection.query(schema);
  }

  await setupConnection.end();

  pool = mysql.createPool({
    ...baseConfig,
    database: dbName
  });

  const connection = await pool.getConnection();
  connection.release();
  console.log('Database connected successfully');

  return pool;
};

const getPool = () => {
  if (!initPromise) {
    initPromise = initializeDatabase().catch((error) => {
      initPromise = null;
      console.error('Error connecting to the database:', error.message);
      throw error;
    });
  }

  return initPromise;
};

module.exports = {
  query: async (...args) => {
    const db = await getPool();
    return db.query(...args);
  },
  execute: async (...args) => {
    const db = await getPool();
    return db.execute(...args);
  },
  getConnection: async () => {
    const db = await getPool();
    return db.getConnection();
  }
};
