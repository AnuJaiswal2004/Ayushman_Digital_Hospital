import Consultation from '../models/Consultation.js';

class ConsultationRepository {
  async create(consultationData) {
    const consultation = new Consultation(consultationData);
    return await consultation.save();
  }

  async findById(id) {
    return await Consultation.findById(id);
  }

  async findByVisitId(visitId) {
    return await Consultation.findOne({ visitId });
  }

  async findByPatientId(patientId) {
    return await Consultation.find({ patientId }).sort({ consultationDate: -1 });
  }

  async update(id, updatedData) {
    return await Consultation.findByIdAndUpdate(
      id,
      { $set: updatedData },
      { new: true }
    );
  }
}

export default new ConsultationRepository();
