import queueRepository from '../repositories/queueRepository.js';
import Visit from '../models/Visit.js';
import auditLogService from './auditLogService.js';

class QueueService {
  async getActiveQueue() {
    return await queueRepository.findActiveQueue();
  }

  async addToQueue(visitId, patientId, departmentId, tokenNumber) {
    const active = await queueRepository.findActiveQueue();
    const queuePosition = active.length + 1;

    return await queueRepository.create({
      tokenNumber,
      patientId,
      visitId,
      departmentId,
      currentStage: 'Waiting',
      estimatedWaitTime: queuePosition * 15, // 15 mins wait time per position
      queuePosition,
      status: 'WAITING'
    });
  }

  async advanceQueue(visitId, requestedBy = 'staff001', role = 'receptionist') {
    const queueEntry = await queueRepository.findByVisitId(visitId);
    if (!queueEntry) throw new Error('Queue item not found for this visit');

    let nextStage = '';
    if (queueEntry.currentStage === 'Waiting') {
      nextStage = 'Vitals';
    } else if (queueEntry.currentStage === 'Vitals') {
      nextStage = 'Consultation';
    } else if (queueEntry.currentStage === 'Consultation') {
      nextStage = 'Billing';
    } else if (queueEntry.currentStage === 'Billing') {
      nextStage = 'Completed';
    }

    if (!nextStage) return queueEntry;

    const updated = await queueRepository.updateStage(visitId, nextStage, 'IN_PROGRESS');

    // Also update corresponding Visit currentStep
    const visit = await Visit.findOne({ id: visitId });
    if (visit) {
      if (nextStage === 'Completed') {
        visit.currentStep = 'completed';
        visit.status = 'completed';
      } else {
        visit.currentStep = nextStage.toLowerCase();
      }
      await visit.save();
    }

    // Re-adjust queue positions for other waiting patients
    if (nextStage === 'Completed') {
      const active = await queueRepository.findActiveQueue();
      let index = 1;
      for (const entry of active) {
        entry.queuePosition = index;
        entry.estimatedWaitTime = index * 15;
        await entry.save();
        index++;
      }
    }

    return updated;
  }
}

export default new QueueService();
