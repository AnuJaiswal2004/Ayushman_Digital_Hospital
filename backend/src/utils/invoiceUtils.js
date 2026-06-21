import Invoice from '../models/Invoice.js';

export const generateInvoiceNumber = async () => {
  try {
    const currentYear = new Date().getFullYear();
    // Count invoices in the current year to make it year-sequential
    const count = await Invoice.countDocuments({
      invoiceNumber: { $regex: new RegExp(`^INV-${currentYear}-`) }
    });
    
    const sequentialNum = (count + 1).toString().padStart(6, '0');
    return `INV-${currentYear}-${sequentialNum}`;
  } catch (error) {
    console.error(`🚨 Failed to generate invoice number: ${error.message}`);
    // Fallback to random string timestamp if count fails
    return `INV-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
  }
};
