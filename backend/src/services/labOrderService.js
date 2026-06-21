import labOrderRepository from '../repositories/labOrderRepository.js';
import patientRepository from '../repositories/patientRepository.js';
import auditLogService from './auditLogService.js';

class LabOrderService {
  async createLabOrder(orderData, requestedBy = 'doctor', role = 'doctor') {
    const order = await labOrderRepository.create(orderData);
    
    await auditLogService.log(
      requestedBy,
      role,
      'Lab Order Placed',
      'LabOrder',
      order._id.toString()
    );

    return order;
  }

  async getAllLabOrders() {
    return await labOrderRepository.findAll();
  }

  async getLabOrderById(id) {
    const order = await labOrderRepository.findById(id);
    if (!order) throw new Error('Lab order not found');
    return order;
  }

  async getLabOrdersByVisit(visitId) {
    return await labOrderRepository.findByVisitId(visitId);
  }

  async updateOrderStatus(id, status, reportUrl = '', requestedBy = 'staff001', role = 'receptionist') {
    const order = await labOrderRepository.updateStatus(id, status, reportUrl);
    if (!order) throw new Error('Lab order not found');

    // If order is completed, push lab result to patient EMR array
    if (status === 'Completed') {
      for (const testName of order.tests) {
        await patientRepository.addLabReport(order.patientId, {
          id: order._id.toString(),
          testName,
          date: new Date().toISOString().split('T')[0],
          result: 'Ready',
          notes: `Test completed. Report URL: ${reportUrl || 'N/A'}`
        });
      }
    }

    await auditLogService.log(
      requestedBy,
      role,
      `Lab Order Status Changed to ${status}`,
      'LabOrder',
      id
    );

    return order;
  }
}

export default new LabOrderService();
