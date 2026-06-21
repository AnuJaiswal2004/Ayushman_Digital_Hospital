import auditLogRepository from '../repositories/auditLogRepository.js';

class AuditLogService {
  async log(userId, role, action, entity, entityId) {
    try {
      const log = await auditLogRepository.create({
        userId,
        role,
        action,
        entity,
        entityId,
        timestamp: new Date()
      });
      console.log(`📝 [AUDIT LOG] ${action} on ${entity} (${entityId}) by ${userId} (${role})`);
      return log;
    } catch (error) {
      console.error(`🚨 Failed to create audit log: ${error.message}`);
    }
  }

  async getAllLogs() {
    return await auditLogRepository.findAll();
  }

  async getLogsByUser(userId) {
    return await auditLogRepository.findByUserId(userId);
  }
}

export default new AuditLogService();
