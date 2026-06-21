import Patient from '../models/Patient.js';

class PatientRepository {
  async findAll() {
    return await Patient.find({});
  }

  async findById(id) {
    return await Patient.findOne({ id });
  }

  async findByAbhaOrPhone(username) {
    return await Patient.findOne({
      $or: [{ abha: username }, { phone: username }]
    });
  }

  async findByPhone(phone) {
    return await Patient.findOne({ phone });
  }

  async create(patientData) {
    const patient = new Patient(patientData);
    return await patient.save();
  }

  async update(id, updatedData) {
    return await Patient.findOneAndUpdate(
      { id },
      { $set: updatedData },
      { new: true }
    );
  }

  async addVital(id, vitalData) {
    return await Patient.findOneAndUpdate(
      { id },
      { $push: { vitals: vitalData } },
      { new: true }
    );
  }

  async addDiagnosis(id, diagnosisData) {
    return await Patient.findOneAndUpdate(
      { id },
      { $push: { diagnoses: diagnosisData } },
      { new: true }
    );
  }

  async addLabReport(id, reportData) {
    return await Patient.findOneAndUpdate(
      { id },
      { $push: { labReports: reportData } },
      { new: true }
    );
  }
}

export default new PatientRepository();
