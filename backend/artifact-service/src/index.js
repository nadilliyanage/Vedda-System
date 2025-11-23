const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = require('./config/database');
const artifactRoutes = require('./routes/artifactRoutes');

const app = express();
const PORT = process.env.PORT || 5010;

// Connect to Database
connectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    message: 'Artifact Service is running',
    timestamp: new Date().toISOString()
  });
});

// Database health check
app.get('/health/db', (req, res) => {
  const dbStatus = mongoose.connection.readyState;
  const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  
  res.status(dbStatus === 1 ? 200 : 503).json({
    database: states[dbStatus],
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/artifacts', artifactRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Artifact Service running on port ${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV}`);
});