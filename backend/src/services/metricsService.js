import Patient from '../models/Patient.js';
import Visit from '../models/Visit.js';
import Appointment from '../models/Appointment.js';
import mongoose from 'mongoose';

// Module level state for global request counter
let totalRequests = 0;

class MetricsService {
  incrementRequestCounter() {
    totalRequests += 1;
  }

  async getMetrics() {
    const uptime = process.uptime(); // in seconds
    
    // Database connectivity check
    let dbStatus = 'disconnected';
    const state = mongoose.connection.readyState;
    if (state === 1) dbStatus = 'connected';
    else if (state === 2) dbStatus = 'connecting';
    else if (state === 3) dbStatus = 'disconnecting';

    // Counts from database
    let patients = 0;
    let visits = 0;
    let appointments = 0;

    try {
      if (state === 1) {
        patients = await Patient.countDocuments();
        visits = await Visit.countDocuments();
        appointments = await Appointment.countDocuments();
      }
    } catch (err) {
      console.error(`⚠️ Metrics aggregation DB query failed: ${err.message}`);
    }

    return {
      uptime,
      totalRequests,
      patients,
      visits,
      appointments,
      dbStatus,
      memoryUsage: process.memoryUsage(),
      cpuUsage: process.cpuUsage(),
      mongoConnections: mongoose.connections.length
    };
  }
}

export default new MetricsService();
export { totalRequests };
