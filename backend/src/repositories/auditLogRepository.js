import AuditLog from '../models/AuditLog.js';

class AuditLogRepository {
  async create(logData) {
    const log = new AuditLog(logData);
    return await log.save();
  }

  async findAll() {
    return await AuditLog.find({}).sort({ timestamp: -1 });
  }

  async findByUserId(userId) {
    return await AuditLog.find({ userId }).sort({ timestamp: -1 });
  }
}

export default new AuditLogRepository();
