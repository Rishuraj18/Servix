const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const baseConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  port: process.env.DB_PORT || 3306,
  multipleStatements: true
};

const reset = async () => {
  const dbName = process.env.DB_NAME || 'servix_db';
  console.log(`Connecting to database to reset: ${dbName}`);
  const connection = await mysql.createConnection(baseConfig);

  try {
    // Drop database if exists to ensure a completely clean slate
    console.log(`Dropping and recreating database \`${dbName}\`...`);
    await connection.query(`DROP DATABASE IF EXISTS \`${dbName}\``);
    await connection.query(`CREATE DATABASE \`${dbName}\``);
    await connection.query(`USE \`${dbName}\``);

    // Read and run schema.sql
    console.log("Loading and running schema.sql...");
    const schemaPath = path.join(__dirname, '..', 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    await connection.query(schema);

    // Read and run seed.sql
    console.log("Loading and running seed.sql...");
    const seedPath = path.join(__dirname, '..', 'seed.sql');
    const seed = fs.readFileSync(seedPath, 'utf8');
    await connection.query(seed);

    console.log("Database reset and seeded successfully!");
  } catch (error) {
    console.error("Failed to reset database:", error);
  } finally {
    await connection.end();
  }
};

reset();
