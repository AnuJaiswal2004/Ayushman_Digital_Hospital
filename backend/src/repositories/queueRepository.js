import Queue from '../models/Queue.js';

class QueueRepository {
  async create(queueData) {
    const queue = new Queue(queueData);
    return await queue.save();
  }

  async findActiveQueue() {
    return await Queue.find({ status: { $in: ['WAITING', 'IN_PROGRESS'] } })
      .sort({ queuePosition: 1 });
  }

  async findByVisitId(visitId) {
    return await Queue.findOne({ visitId });
  }

  async findByPatientId(patientId) {
    return await Queue.findOne({ patientId, status: { $in: ['WAITING', 'IN_PROGRESS'] } });
  }

  async findCountByDepartmentAndStage(departmentId, stage) {
    return await Queue.countDocuments({ departmentId, currentStage: stage, status: { $in: ['WAITING', 'IN_PROGRESS'] } });
  }

  async updateStage(visitId, stage, status = 'WAITING') {
    const update = { currentStage: stage, status };
    if (stage === 'Completed') {
      update.status = 'COMPLETED';
    } else if (stage === 'Vitals' || stage === 'Consultation' || stage === 'Billing') {
      update.status = 'IN_PROGRESS';
    }
    
    return await Queue.findOneAndUpdate(
      { visitId },
      { $set: update },
      { new: true }
    );
  }
}

export default new QueueRepository();
