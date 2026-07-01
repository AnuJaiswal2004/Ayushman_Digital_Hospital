import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import mongoose from 'mongoose';
import { errorHandler } from './middleware/errorMiddleware.js';

// Route imports
import authRoutes from './routes/authRoutes.js';
import patientRoutes from './routes/patientRoutes.js';
import doctorRoutes from './routes/doctorRoutes.js';
import appointmentRoutes from './routes/appointmentRoutes.js';
import billingRoutes from './routes/billingRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import consultationRoutes from './routes/consultationRoutes.js';
import labOrderRoutes from './routes/labOrderRoutes.js';
import queueRoutes from './routes/queueRoutes.js';
import fileRoutes from './routes/fileRoutes.js';
import swaggerRoutes from './routes/swagger.js';

// Services
import metricsService from './services/metricsService.js';

dotenv.config();

const app = express();

// Request metrics logging middleware
app.use((req, res, next) => {
  metricsService.incrementRequestCounter();
  next();
});

// Statically serve uploaded files
const staticUploadsPath = process.cwd().endsWith('backend') ? 'uploads' : 'backend/uploads';
app.use('/uploads', express.static(staticUploadsPath));

// General Middlewares
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// ================= ROOT LEVEL ENDPOINTS =================

// Health check endpoint (Custom health response)
app.get('/api/health', (req, res) => {
  const dbState = mongoose.connection.readyState === 1 ? 'CONNECTED' : 'DISCONNECTED';
  res.status(200).json({
    status: dbState === 'CONNECTED' ? 'UP' : 'DOWN',
    database: dbState
  });
});

// Metrics aggregation endpoint (from MetricsService)
app.get('/api/metrics', async (req, res, next) => {
  try {
    const metrics = await metricsService.getMetrics();
    res.status(200).json(metrics);
  } catch (error) {
    next(error);
  }
});

// ================= VERSIONED API ENDPOINTS (/api/v1) =================

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/patients', patientRoutes);
app.use('/api/v1/doctors', doctorRoutes);
app.use('/api/v1/visits', appointmentRoutes); // Mounts under /visits to support frontend apiService calls
app.use('/api/v1/appointments', appointmentRoutes); // Mounts under /appointments as standard alias
app.use('/api/v1/billing', billingRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/consultations', consultationRoutes);
app.use('/api/v1/lab-orders', labOrderRoutes);
app.use('/api/v1/queue', queueRoutes);
app.use('/api/v1/files', fileRoutes);

// Mounting Swagger UI under versioned api path: /api/v1/docs
app.use('/api/v1/docs', swaggerRoutes);

// Dashboards mounted at versioned level
app.use('/api/v1', dashboardRoutes);

// Fallback for Page Not Found (404)
app.use((req, res, next) => {
  res.status(404).json({ success: false, message: 'Resource not found' });
});

// Centralized Error Handling Middleware
app.use(errorHandler);

export default app;
