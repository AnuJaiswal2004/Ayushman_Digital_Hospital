require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const connectDB = require('./config/database');

// Initialize Express app
const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Import routes
const patientRoutes = require('./routes/patient');
const visitRoutes = require('./routes/visit');
const staffRoutes = require('./routes/staff');
const departmentRoutes = require('./routes/department');
const authRoutes = require('./routes/auth');

// API Routes
app.use('/api/patients', patientRoutes);
app.use('/api/visits', visitRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/auth', authRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Hospital Management System API is running',
    timestamp: new Date().toISOString()
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to Hospital Management System API',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      patients: '/api/patients',
      visits: '/api/visits',
      staff: '/api/staff',
      departments: '/api/departments',
      auth: '/api/auth'
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal Server Error',
      status: err.status || 500
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: {
      message: 'Route not found',
      status: 404
    }
  });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📍 API URL: http://localhost:${PORT}`);
  console.log(`🏥 Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
