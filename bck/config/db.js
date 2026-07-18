const mongoose = require('mongoose');
require('dotenv').config();

let initPromise;

const initializeDatabase = async () => {
  if (mongoose.connection.readyState >= 1) {
    return mongoose.connection;
  }

  // Fallback if not specified in env
  const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/servix_db';

  try {
    await mongoose.connect(mongoUri);
    console.log('MongoDB connected successfully');
    return mongoose.connection;
  } catch (error) {
    console.error('Error connecting to MongoDB:', error.message);
    throw error;
  }
};

const getPool = () => {
  if (!initPromise) {
    initPromise = initializeDatabase().catch((error) => {
      initPromise = null;
      throw error;
    });
  }
  return initPromise;
};

// We export getConnection so that server.js can await database connection before starting
module.exports = {
  getConnection: async () => {
    return await getPool();
  }
};
