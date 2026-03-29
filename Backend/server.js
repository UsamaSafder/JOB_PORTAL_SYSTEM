const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config();

const { connectMongo, disconnectMongo } = require('./config/mongodb');

// Import routes (located under ./src/routes)
const authRoutes = require('./routes/auth');
const jobRoutes = require('./routes/jobs');
const applicationRoutes = require('./routes/applications');
const userRoutes = require('./routes/users');
const companyRoutes = require('./routes/companies');

// Initialize express app
const app = express();

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
})); // Security headers
// Allow configured origins. In development if no ALLOWED_ORIGINS is provided we allow all origins
const allowedOriginsEnv = process.env.ALLOWED_ORIGINS;
const corsOptions = {
  origin: allowedOriginsEnv ? allowedOriginsEnv.split(',') : true,
  credentials: true
};
app.use(cors(corsOptions));
app.use(morgan('combined')); // Logging
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Serve static uploads folder — prefer 'uploads' at project root but also support 'src/uploads'
const uploadsPath = path.join(__dirname, 'uploads');
const srcUploadsPath = path.join(__dirname, 'src', 'uploads');
if (require('fs').existsSync(uploadsPath)) {
  app.use('/uploads', express.static(uploadsPath, {
    setHeaders: (res) => {
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    }
  }));
} else if (require('fs').existsSync(srcUploadsPath)) {
  app.use('/uploads', express.static(srcUploadsPath, {
    setHeaders: (res) => {
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    }
  }));
} else {
  // create a simple uploads endpoint so clients won't 404 badly if folder missing
  app.use('/uploads', (req, res) => res.status(404).json({ error: 'No uploads configured' }));
}

// Welcome route
app.get('/', (req, res) => {
  res.json({ 
    message: '🚀 Job Portal API',
    status: 'Running',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      jobs: '/api/jobs',
      applications: '/api/applications',
      users: '/api/users'
    },
    documentation: 'API documentation coming soon'
  });
});

// Health check route
app.get('/health', (req, res) => {
  const connected = mongoose.connection.readyState === 1;
  if (!connected) {
    return res.status(503).json({ status: 'unhealthy', database: 'disconnected', message: 'MongoDB is not connected' });
  }

  res.json({ status: 'healthy', database: 'connected', timestamp: new Date().toISOString() });
});

// MongoDB health check route to validate read/write access quickly.
app.get('/api/mongo-health', async (req, res) => {
  try {
    const collection = mongoose.connection.db.collection('healthcheck');
    const payload = { source: 'api/mongo-health', checkedAt: new Date() };
    await collection.insertOne(payload);
    const latest = await collection.findOne({}, { sort: { _id: -1 } });

    res.json({
      status: 'healthy',
      mongo: 'connected',
      latest
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      mongo: 'disconnected',
      message: error.message
    });
  }
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/users', userRoutes);
app.use('/api/companies', companyRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Route not found',
    message: `Cannot ${req.method} ${req.path}`,
    availableRoutes: [
      'GET /',
      'GET /health',
      'POST /api/auth/register',
      'POST /api/auth/login',
      'GET /api/jobs',
      'GET /api/applications',
      'GET /api/users'
    ]
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  if (err.name === 'ValidationError') {
    return res.status(400).json({ error: err.message });
  }
  
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  res.status(500).json({ 
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// Initialize database and start server
const PORT = process.env.PORT || 5001;

const startServer = async () => {
  try {

    // Connect to MongoDB.
    await connectMongo();

    

    // Start server with error handling
    const server = app.listen(PORT, () => {
      console.log(`✓ Server running on port ${PORT}`);
      console.log(`✓ Environment: ${process.env.NODE_ENV}`);
      console.log(`✓ API Base URL: http://localhost:${PORT}/api`);
      console.log(`✓ Welcome page: http://localhost:${PORT}/`);
    });

    // Handle port already in use error
    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`✗ Port ${PORT} is already in use`);
        console.log(`\nTo fix this, run one of these commands:\n`);
        console.log(`1. Find process: netstat -ano | findstr :${PORT}`);
        console.log(`2. Kill process: taskkill /PID <PID> /F`);
        console.log(`3. Or change PORT in .env file\n`);
        process.exit(1);
      } else {
        console.error('Server error:', err);
        process.exit(1);
      }
    });

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\nShutting down gracefully...');
  await disconnectMongo();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\nShutting down gracefully...');
  await disconnectMongo();
  process.exit(0);
});

// Start the server
startServer();

module.exports = app;