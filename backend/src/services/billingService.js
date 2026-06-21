import Billing from '../models/Billing.js';
import Visit from '../models/Visit.js';
import billingRepository from '../repositories/billingRepository.js';
import appointmentRepository from '../repositories/appointmentRepository.js';
import auditLogService from './auditLogService.js';
import Invoice from '../models/Invoice.js';
import { generateInvoiceNumber } from '../utils/invoiceUtils.js';
import queueRepository from '../repositories/queueRepository.js';

class BillingService {
  async processPayment(tokenOrId, paymentMethod, totalAmount, processedBy = 'receptionist', role = 'receptionist') {
    const visit = await appointmentRepository.findVisitById(tokenOrId);
    if (!visit) throw new Error('Visit not found');

    const billingRecord = await billingRepository.create({
      visitId: visit.id,
      patientId: visit.patientId,
      patientName: visit.patientName,
      totalAmount,
      paymentMethod,
      paidAt: new Date(),
      processedBy,
      status: 'paid'
    });

    // Generate and save Invoice record
    const invoiceNumber = await generateInvoiceNumber();
    const gst = Math.round(totalAmount * 0.18); // 18% GST standard calculation
    await Invoice.create({
      invoiceNumber,
      billingId: billingRecord._id.toString(),
      totalAmount,
      gst,
      generatedAt: new Date()
    });

    visit.billing = {
      totalAmount,
      paymentMethod,
      paidAt: new Date(),
      processedBy,
      status: 'paid'
    };
    visit.status = 'completed';
    visit.currentStep = 'completed';
    await visit.save();

    // Advance queue status for this visit
    await queueRepository.updateStage(visit.id, 'Completed');

    // Log in AuditLog
    await auditLogService.log(
      processedBy,
      role,
      'Bill Generated',
      'Billing',
      billingRecord._id.toString()
    );

    return {
      ...billingRecord.toObject(),
      invoiceNumber,
      gst
    };
  }

  async getBillingByVisit(visitId) {
    return await billingRepository.findByVisitId(visitId);
  }
}

export default new BillingService();
