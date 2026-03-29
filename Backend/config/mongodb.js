const mongoose = require('mongoose');

const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/job_portal_db';

const connectMongo = async () => {
  try {
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000
    });
    console.log('✓ MongoDB connected');
  } catch (error) {
    console.error('✗ MongoDB connection error:', error?.message || error);
    throw error;
  }
};

const disconnectMongo = async () => {
  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
      console.log('✓ MongoDB disconnected');
    }
  } catch (error) {
    console.error('MongoDB disconnect error:', error?.message || error);
    throw error;
  }
};

module.exports = {
  connectMongo,
  disconnectMongo
};