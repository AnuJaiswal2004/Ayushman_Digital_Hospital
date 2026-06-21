import Invoice from '../models/Invoice.js';

class InvoiceRepository {
  async create(invoiceData) {
    const invoice = new Invoice(invoiceData);
    return await invoice.save();
  }

  async findByBillingId(billingId) {
    return await Invoice.findOne({ billingId });
  }

  async findByInvoiceNumber(invoiceNumber) {
    return await Invoice.findOne({ invoiceNumber });
  }
}

export default new InvoiceRepository();
