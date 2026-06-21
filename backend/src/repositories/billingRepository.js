import Billing from '../models/Billing.js';

class BillingRepository {
  async findAll() {
    return await Billing.find({});
  }

  async findById(id) {
    return await Billing.findById(id);
  }

  async findByVisitId(visitId) {
    return await Billing.findOne({ visitId });
  }

  async create(billingData) {
    const billing = new Billing(billingData);
    return await billing.save();
  }

  async updateStatus(visitId, status) {
    return await Billing.findOneAndUpdate(
      { visitId },
      { $set: { status } },
      { new: true }
    );
  }
}

export default new BillingRepository();
