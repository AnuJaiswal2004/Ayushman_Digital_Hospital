import patientRepository from '../repositories/patientRepository.js';
import auditLogService from './auditLogService.js';

class PatientService {
  async getAllPatients() {
    return await patientRepository.findAll();
  }

  async getPatientById(id) {
    const patient = await patientRepository.findById(id);
    if (!patient) throw new Error('Patient not found');
    return patient;
  }

  async updatePatient(id, updatedData, requestedBy = 'System', role = 'system') {
    const patient = await patientRepository.update(id, updatedData);
    if (!patient) throw new Error('Patient not found');

    // Audit Log for EMR or Profile update
    await auditLogService.log(
      requestedBy,
      role,
      'Patient Profile Updated',
      'Patient',
      id
    );

    return patient;
  }

  async getEMR(patientId) {
    const patient = await this.getPatientById(patientId);
    return {
      vitals: patient.vitals || [],
      allergies: patient.allergies || [],
      diagnoses: patient.diagnoses || [],
      surgeries: patient.surgeries || [],
      labReports: patient.labReports || []
    };
  }

  async updateEMR(patientId, emrData, requestedBy = 'System', role = 'system') {
    const patient = await patientRepository.findById(patientId);
    if (!patient) throw new Error('Patient not found');

    if (emrData.vitals) patient.vitals = emrData.vitals;
    if (emrData.allergies) patient.allergies = emrData.allergies;
    if (emrData.diagnoses) patient.diagnoses = emrData.diagnoses;
    if (emrData.surgeries) patient.surgeries = emrData.surgeries;
    if (emrData.labReports) patient.labReports = emrData.labReports;

    await patient.save();

    await auditLogService.log(
      requestedBy,
      role,
      'EMR Record Updated',
      'Patient',
      patientId
    );

    return patient;
  }
}

export default new PatientService();
