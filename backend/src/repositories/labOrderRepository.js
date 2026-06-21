import LabOrder from '../models/LabOrder.js';

class LabOrderRepository {
  async create(orderData) {
    const order = new LabOrder(orderData);
    return await order.save();
  }

  async findAll() {
    return await LabOrder.find({}).sort({ createdAt: -1 });
  }

  async findById(id) {
    return await LabOrder.findById(id);
  }

  async findByVisitId(visitId) {
    return await LabOrder.find({ visitId });
  }

  async findByPatientId(patientId) {
    return await LabOrder.find({ patientId }).sort({ createdAt: -1 });
  }

  async updateStatus(id, status, reportUrl = '') {
    const update = { status };
    if (reportUrl) update.reportUrl = reportUrl;
    
    return await LabOrder.findByIdAndUpdate(
      id,
      { $set: update },
      { new: true }
    );
  }
}

export default new LabOrderRepository();
