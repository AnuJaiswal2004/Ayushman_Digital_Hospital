import React, { useState, useEffect } from 'react';
import { 
  Receipt, User, Search, CreditCard, CheckCircle2, 
  Printer, DollarSign, Activity, FileText, X, Sparkles
} from 'lucide-react';
import { apiService } from '../../../services/api.js';

export default function BillingTab() {
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [billingQueue, setBillingQueue] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Selected Billing Session
  const [selectedAppt, setSelectedAppt] = useState(null);
  const [charges, setCharges] = useState({
    consultation: 500,
    lab: 800,
    registration: 100,
    misc: 0
  });
  const [paymentMethod, setPaymentMethod] = useState('upi');

  // Completed Invoice Modal
  const [invoicePreview, setInvoicePreview] = useState(null);

  const loadData = async () => {
    const allAppts = await apiService.getAppointments();
    const allPatients = await apiService.getPatients();
    setAppointments(allAppts);
    setPatients(allPatients);

    // Filter appointments: status is 'completed', has no 'billing', and has consultation
    const queue = allAppts.filter(a => a.status === 'completed' && !a.billing && a.consultation);
    setBillingQueue(queue);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSelectPatient = (appt) => {
    setSelectedAppt(appt);
    
    // Auto-fill consultation to 500
    // Auto-fill lab to 800 if they had a lab test or custom medications, otherwise default to 0 but editable
    const patientObj = patients.find(p => p.id === appt.patientId);
    const hasLab = patientObj?.emr?.labTests?.length > 0 || appt.reason?.toLowerCase().includes('lab') || appt.reason?.toLowerCase().includes('test');
    
    setCharges({
      consultation: 500,
      lab: hasLab ? 800 : 0,
      registration: 100,
      misc: 0
    });
    setPaymentMethod('upi');
  };

  // Live Auto-Calculations
  const subtotal = Number(charges.consultation) + Number(charges.lab) + Number(charges.registration) + Number(charges.misc);
  const gst = subtotal * 0.18; // 18% GST
  const grandTotal = subtotal + gst;

  const handleProcessBilling = async (e) => {
    e.preventDefault();
    if (!selectedAppt) return;

    try {
      const allAppts = JSON.parse(localStorage.getItem('appointments')) || [];
      const idx = allAppts.findIndex(a => a.id === selectedAppt.id || a._id === selectedAppt.id);
      
      if (idx !== -1) {
        const patientObj = patients.find(p => p.id === selectedAppt.patientId);
        const abhaId = patientObj ? patientObj.abha : 'N/A';
        const invoiceNo = 'INV-' + new Date().getFullYear() + '-' + String(allAppts.filter(a => a.billing).length + 1).padStart(4, '0');
        
        const billingData = {
          invoiceNo,
          patientName: selectedAppt.patientName,
          abhaId,
          charges: {
            consultation: Number(charges.consultation),
            lab: Number(charges.lab),
            registration: Number(charges.registration),
            misc: Number(charges.misc)
          },
          subtotal,
          gst,
          total: grandTotal,
          paymentMethod,
          paidAt: new Date().toISOString()
        };

        // Update appointment details in storage
        allAppts[idx].billing = billingData;
        // Mark status as completed (or keep completed, but now it has billing)
        localStorage.setItem('appointments', JSON.stringify(allAppts));

        // Add System Notification for Billing completed
        await apiService.addNotification({
          title: '💰 Payment Received',
          message: `Dues paid successfully for ${selectedAppt.patientName}. Invoice: ${invoiceNo}.`,
          type: 'billing',
          targetRoles: ['admin', 'receptionist']
        });

        // Add Patient Notification
        await apiService.addNotification({
          title: '💰 Payment Receipt Confirmed',
          message: `Your payment of ₹${grandTotal.toFixed(2)} is verified. Invoice #${invoiceNo} has been generated.`,
          type: 'billing',
          targetUserId: selectedAppt.patientId,
          targetRoles: ['patient']
        });

        alert(`Checkout Complete! Invoice #${invoiceNo} generated.`);
        setInvoicePreview(billingData);
        setSelectedAppt(null);
        loadData();
      }
    } catch (err) {
      alert('Failed to process billing checkout');
    }
  };

  const handlePrintPDF = (inv) => {
    const printWindow = window.open('', '_blank', 'width=850,height=650');
    if (!printWindow) {
      alert('Please allow popups to print invoices');
      return;
    }

    const htmlContent = `
      <html>
        <head>
          <title>Invoice #${inv.invoiceNo}</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
            @media print {
              body { padding: 20px; font-family: sans-serif; background-color: white !important; color: black !important; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body class="bg-slate-50 text-slate-800 p-8">
          <div class="max-w-3xl mx-auto bg-white border border-slate-200 rounded-3xl p-8 space-y-6 shadow-md">
            
            <!-- Logo & Title -->
            <div class="flex justify-between items-start border-b border-slate-100 pb-6">
              <div>
                <h2 class="font-extrabold text-xl text-indigo-700 tracking-tight">AYUSHMAN DIGITAL HOSPITAL</h2>
                <p class="text-xs text-slate-400 font-semibold tracking-wider uppercase mt-1">Ministry of Health & Family Welfare</p>
                <p class="text-[10px] text-slate-400 mt-2 font-medium">Near Central Park, Chanakyapuri, New Delhi, India</p>
              </div>
              <div class="text-right">
                <span class="bg-emerald-50 text-emerald-700 text-[10px] font-black px-3 py-1 rounded border border-emerald-150 uppercase tracking-widest">PAID RECEIPT</span>
                <h3 class="font-bold text-sm text-slate-800 mt-3 font-mono">Invoice #${inv.invoiceNo}</h3>
                <p class="text-[10px] text-slate-400 font-medium">Date: ${new Date(inv.paidAt).toLocaleDateString()}</p>
              </div>
            </div>

            <!-- Patient Information Card -->
            <div class="grid grid-cols-2 gap-4 text-xs font-semibold text-slate-500 bg-slate-50 p-5 rounded-2xl border border-slate-100">
              <div>
                <span class="text-[9px] text-slate-400 font-bold block uppercase">Patient Details</span>
                <span class="text-slate-800 font-black text-sm block mt-1">${inv.patientName}</span>
                <span class="text-[10px] font-mono block mt-1 text-slate-400">ABHA ID: ${inv.abhaId}</span>
              </div>
              <div class="text-right">
                <span class="text-[9px] text-slate-400 font-bold block uppercase">Payment Mode</span>
                <span class="text-slate-800 block mt-1">Method: <strong class="uppercase text-indigo-600">${inv.paymentMethod}</strong></span>
                <span class="text-[10px] text-slate-400 block mt-1">Status: Confirmed & Discharged</span>
              </div>
            </div>

            <!-- Itemized list -->
            <table class="w-full text-xs text-left">
              <thead>
                <tr class="border-b border-slate-200 text-[9px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50/50">
                  <th class="py-3 px-4">Service / Roster Charge Description</th>
                  <th class="py-3 px-4 text-right">Amount</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 text-slate-655 font-medium">
                <tr>
                  <td class="py-4 px-4 font-bold">Outpatient Clinical Consultation Fee</td>
                  <td class="py-4 px-4 text-right font-mono">₹${inv.charges.consultation.toFixed(2)}</td>
                </tr>
                ${inv.charges.lab > 0 ? `
                  <tr>
                    <td class="py-4 px-4 font-bold">Diagnostic Lab Roster Charges</td>
                    <td class="py-4 px-4 text-right font-mono">₹${inv.charges.lab.toFixed(2)}</td>
                  </tr>
                ` : ''}
                ${inv.charges.registration > 0 ? `
                  <tr>
                    <td class="py-4 px-4 font-bold">Clinical Portal Registration Fee</td>
                    <td class="py-4 px-4 text-right font-mono">₹${inv.charges.registration.toFixed(2)}</td>
                  </tr>
                ` : ''}
                ${inv.charges.misc > 0 ? `
                  <tr>
                    <td class="py-4 px-4 font-bold">Miscellaneous Pharmacy Charges</td>
                    <td class="py-4 px-4 text-right font-mono">₹${inv.charges.misc.toFixed(2)}</td>
                  </tr>
                ` : ''}
              </tbody>
            </table>

            <!-- Summary Totals -->
            <div class="border-t border-slate-250 pt-4 flex flex-col items-end text-xs font-semibold text-slate-500 gap-1.5 pr-4">
              <div class="flex gap-16 justify-between w-64">
                <span>Subtotal:</span>
                <span class="font-mono text-slate-700">₹${inv.subtotal.toFixed(2)}</span>
              </div>
              <div class="flex gap-16 justify-between w-64">
                <span>GST (18%):</span>
                <span class="font-mono text-slate-700">₹${inv.gst.toFixed(2)}</span>
              </div>
              <div class="flex gap-16 justify-between w-64 pt-2.5 border-t border-slate-200 font-black text-slate-800 text-sm">
                <span>Grand Total:</span>
                <span class="font-mono text-emerald-650">₹${inv.total.toFixed(2)}</span>
              </div>
            </div>

            <!-- Receipt stamp footer -->
            <div class="border-t border-slate-100 pt-6 text-center text-[9px] text-slate-400 font-medium">
              <p>This is a secure, computer-generated transaction record issued under the National Digital Health Locker (ABDM) guidelines.</p>
              <p class="mt-1">For any queries, contact Ministry Support Desk. Thank you for your cooperation!</p>
            </div>
          </div>

          <script>
            window.onload = function() {
              window.print();
            }
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const filteredQueue = billingQueue.filter(appt => 
    appt.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    appt.doctor.toLowerCase().includes(searchQuery.toLowerCase()) ||
    appt.token?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-5xl w-full">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT CARD: Billing Queue (lg:col-span-5) */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 lg:col-span-5 shadow-sm space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <div className="bg-indigo-500/10 p-2.5 rounded-xl text-indigo-600">
              <Receipt className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-800 font-heading">Billing Desk Queue</h3>
              <p className="text-[10px] text-slate-400 font-medium">Process invoices for completed consultations</p>
            </div>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search active tokens..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs font-semibold outline-none focus:border-blue-500"
            />
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
            {filteredQueue.length === 0 ? (
              <p className="text-center py-8 text-slate-400 text-xs font-medium">No patients waiting in billing queue.</p>
            ) : (
              filteredQueue.map(appt => {
                const isSelected = selectedAppt?.id === appt.id;
                return (
                  <div
                    key={appt.id}
                    onClick={() => handleSelectPatient(appt)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer text-left ${
                      isSelected 
                        ? 'bg-blue-50/50 border-blue-500/80 shadow-sm' 
                        : 'bg-slate-50/40 border-slate-150 hover:bg-slate-50/90'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-mono text-emerald-600 font-black text-[11px] block">{appt.token || 'OPD-N/A'}</span>
                        <h4 className="font-extrabold text-xs text-slate-800 mt-1">{appt.patientName}</h4>
                        <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Doctor: {appt.doctor}</p>
                      </div>
                      <span className="bg-amber-100 text-amber-700 text-[8px] font-black px-1.5 py-0.5 rounded border border-amber-200">
                        BILLING PENDING
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT CARD: Calculator & Form (lg:col-span-7) */}
        <div className="lg:col-span-7 space-y-6">
          {selectedAppt ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="pb-3 border-b border-slate-100 flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-sm text-slate-800 font-heading">Invoice Calculator</h3>
                  <p className="text-[10px] text-slate-400 font-medium">Generate transaction items for: <strong className="text-slate-700">{selectedAppt.patientName}</strong></p>
                </div>
                <button 
                  onClick={() => setSelectedAppt(null)}
                  className="p-1 hover:bg-slate-100 rounded-full text-slate-400 cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleProcessBilling} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase">Consultation Fee (₹)</label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={charges.consultation}
                      onChange={(e) => setCharges({ ...charges, consultation: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs outline-none font-semibold focus:border-blue-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase">Lab Roster Charges (₹)</label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={charges.lab}
                      onChange={(e) => setCharges({ ...charges, lab: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs outline-none font-semibold focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase">Registration Fee (₹)</label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={charges.registration}
                      onChange={(e) => setCharges({ ...charges, registration: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs outline-none font-semibold focus:border-blue-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase">Misc / Pharmacy (₹)</label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={charges.misc}
                      onChange={(e) => setCharges({ ...charges, misc: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs outline-none font-semibold focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Sub-totals display */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60 text-xs font-semibold text-slate-550 space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span className="font-mono text-slate-700">₹{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>GST (18%):</span>
                    <span className="font-mono text-slate-700">₹{gst.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-slate-200 font-black text-slate-800 text-sm">
                    <span>Total Bill:</span>
                    <span className="font-mono text-emerald-650">₹{grandTotal.toFixed(2)}</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-slate-400 uppercase">Payment Mode</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-semibold outline-none cursor-pointer text-slate-750"
                  >
                    <option value="upi">UPI / QR Code Scan</option>
                    <option value="cash">Cash Payment</option>
                    <option value="card">Credit / Debit Card</option>
                    <option value="insurance">Insurance Roster Billing</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-md cursor-pointer text-xs"
                >
                  Generate Invoice & Discharge Patient
                </button>
              </form>
            </div>
          ) : (
            <div className="text-center py-20 bg-white border border-slate-200 rounded-2xl text-slate-400 font-medium text-xs shadow-sm">
              Select a patient from the pending queue to generate an invoice.
            </div>
          )}
        </div>
      </div>

      {/* Invoice Preview Modal */}
      {invoicePreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 relative space-y-4">
            
            {/* Modal close */}
            <button 
              onClick={() => setInvoicePreview(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-800 p-1 hover:bg-slate-50 rounded-full cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="text-center pb-2 border-b border-slate-100">
              <Sparkles className="h-6 w-6 text-emerald-650 mx-auto mb-2" />
              <h3 className="text-sm font-black text-slate-800 font-heading">Payment Verified</h3>
              <p className="text-[10px] text-slate-400 font-medium">Invoice generated successfully</p>
            </div>

            {/* Receipt Summary */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100/60 text-xs font-semibold text-slate-600 space-y-2">
              <div className="flex justify-between">
                <span>Invoice No:</span>
                <span className="font-mono text-slate-800">{invoicePreview.invoiceNo}</span>
              </div>
              <div className="flex justify-between">
                <span>Patient:</span>
                <span className="text-slate-800 font-bold">{invoicePreview.patientName}</span>
              </div>
              <div className="flex justify-between">
                <span>Method:</span>
                <span className="text-indigo-650 font-bold uppercase">{invoicePreview.paymentMethod}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-200/80 font-black text-slate-800 text-sm">
                <span>Grand Total:</span>
                <span className="font-mono text-emerald-650">₹{invoicePreview.total.toFixed(2)}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setInvoicePreview(null)}
                className="bg-slate-200 hover:bg-slate-250 text-slate-700 font-bold px-4 py-3 rounded-xl text-xs cursor-pointer flex-1"
              >
                Close
              </button>
              <button
                onClick={() => handlePrintPDF(invoicePreview)}
                className="bg-indigo-650 hover:bg-indigo-700 text-white font-bold px-4 py-3 rounded-xl text-xs cursor-pointer flex-1 flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/10"
              >
                <Printer className="h-4 w-4" /> Print / Export PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
