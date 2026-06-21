import consultationRepository from '../repositories/consultationRepository.js';
import patientRepository from '../repositories/patientRepository.js';
import appointmentRepository from '../repositories/appointmentRepository.js';
import queueRepository from '../repositories/queueRepository.js';
import auditLogService from './auditLogService.js';

class ConsultationService {
  async createConsultation(consultationData, requestedBy = 'doctor', role = 'doctor') {
    const consultation = await consultationRepository.create({
      ...consultationData,
      consultationDate: new Date()
    });

    // Update patient EMR diagnoses array
    await patientRepository.addDiagnosis(consultation.patientId, {
      disease: consultation.diagnosis,
      diagnosedBy: requestedBy,
      diagnosedAt: new Date()
    });

    // Update Visit currentStep to 'billing'
    const visit = await appointmentRepository.findVisitById(consultation.visitId);
    if (visit) {
      visit.consultation = {
        complaint: consultation.chiefComplaint,
        examination: consultation.examination,
        diagnosis: consultation.diagnosis,
        treatment: consultation.treatmentPlan,
        consultedBy: requestedBy,
        consultedAt: new Date()
      };
      visit.currentStep = 'billing';
      await visit.save();
    }

    // Advance patient stage in the clinic queue
    await queueRepository.updateStage(consultation.visitId, 'Billing');

    // Audit Log
    await auditLogService.log(
      requestedBy,
      role,
      'Consultation Logged',
      'Consultation',
      consultation._id.toString()
    );

    return consultation;
  }

  async getConsultationById(id) {
    const consultation = await consultationRepository.findById(id);
    if (!consultation) throw new Error('Consultation record not found');
    return consultation;
  }

  async getConsultationByVisit(visitId) {
    return await consultationRepository.findByVisitId(visitId);
  }

  async getConsultationsByPatient(patientId) {
    return await consultationRepository.findByPatientId(patientId);
  }

  async updateConsultation(id, updatedData, requestedBy = 'doctor', role = 'doctor') {
    const consultation = await consultationRepository.update(id, updatedData);
    if (!consultation) throw new Error('Consultation not found');

    await auditLogService.log(
      requestedBy,
      role,
      'Consultation Updated',
      'Consultation',
      id
    );

    return consultation;
  }
}

export default new ConsultationService();
