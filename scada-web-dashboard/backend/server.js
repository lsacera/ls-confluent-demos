const express = require('express');
const cors = require('cors');
const NodeCache = require('node-cache');
const path = require('path');
const fs = require('fs');

// Load environment variables from parent directory (.env) or current directory
const parentEnvPath = path.resolve(__dirname, '../.env');
const currentEnvPath = path.resolve(__dirname, '.env');

if (fs.existsSync(parentEnvPath)) {
  // Load from parent directory (scada-web-dashboard/.env)
  require('dotenv').config({ path: parentEnvPath });
  console.log('📂 Loaded environment from parent directory (.env)');
} else if (fs.existsSync(currentEnvPath)) {
  // Fallback to current directory (backend/.env)
  require('dotenv').config({ path: currentEnvPath });
  console.log('📂 Loaded environment from current directory (backend/.env)');
} else {
  console.warn('⚠️  No .env file found. Using environment variables only.');
}

const overviewRoutes = require('./routes/overview');
const anomaliesRoutes = require('./routes/anomalies');
const gridRoutes = require('./routes/grid');
const sensorsRoutes = require('./routes/sensors');
const geographicRoutes = require('./routes/geographic');
const architectureRoutes = require('./routes/architecture');

const app = express();
const PORT = process.env.PORT || 3000;

// Cache middleware (5 seconds TTL by default)
const cache = new NodeCache({ stdTTL: parseInt(process.env.CACHE_TTL) || 5 });

// Middleware
app.use(cors());
app.use(express.json());

// Cache middleware function
app.use((req, res, next) => {
  req.cache = cache;
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/overview', overviewRoutes);
app.use('/api/anomalies', anomaliesRoutes);
app.use('/api/grid', gridRoutes);
app.use('/api/sensors', sensorsRoutes);
app.use('/api/geographic', geographicRoutes);
app.use('/api/architecture', architectureRoutes);

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`SCADA Dashboard Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing server...');
  const { closeConnection } = require('./config/postgres');
  await closeConnection();
  process.exit(0);
});
