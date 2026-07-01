import React, { useState, useEffect } from 'react';
import { 
  Receipt, Search, Calculator, Check, ArrowRight, Printer, AlertTriangle 
} from 'lucide-react';
import { apiService } from '../../../services/api.js';
import Card from '../../../components/ui/Card.jsx';
import Input from '../../../components/ui/Input.jsx';
import Select from '../../../components/ui/Select.jsx';
import Button from '../../../components/ui/Button.jsx';
import Badge from '../../../components/ui/Badge.jsx';
import Table from '../../../components/ui/Table.jsx';

export default function BillingTab() {
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Selection states
  const [selectedAppt, setSelectedAppt] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [invoicePreview, setInvoicePreview] = useState(null);

  // Billing Itemized Charges
  const [charges, setCharges] = useState({
    consultation: 350.00,
    lab: 0.00,
    registration: 100.00
  });

  const loadData = async () => {
    const listAppts = await apiService.getAppointments();
    const listPatients = await apiService.getPatients();
    setAppointments(listAppts);
    setPatients(listPatients);
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter completed appointments that have NO billing processed yet
  const billingQueue = appointments.filter(a => a.status === 'completed' && !a.billing);

  const handleSelectPatient = (appt) => {
    setSelectedAppt(appt);
    setInvoicePreview(null);

    // Compute active lab tests
    const patientObj = patients.find(p => p.id === appt.patientId);
    let labCharges = 0;
    
    // Check if patient has EMR lab tests matching today
    if (patientObj?.emr?.labTests) {
      const todayStr = new Date().toISOString().split('T')[0];
      const todayTests = patientObj.emr.labTests.filter(t => t.date === todayStr);
      // Flat 450 per lab test roster fee
      labCharges = todayTests.length * 450.00;
    }

    setCharges({
      consultation: 350.00,
      lab: labCharges,
      registration: appt.type === 'opd' ? 100.00 : 0.00
    });
  };

  const handleCheckout = async () => {
    if (!selectedAppt) return;
    
    const grandTotal = charges.consultation + charges.lab + charges.registration;
    const invoiceNo = `AD-${Date.now().toString().slice(-6)}`;

    try {
      const patientObj = patients.find(p => p.id === selectedAppt.patientId);
      
      const billingData = {
        invoiceNo,
        patientId: selectedAppt.patientId,
        patientName: selectedAppt.patientName,
        abhaId: patientObj?.abha || 'N/A',
        appointmentId: selectedAppt.id,
        charges: { ...charges },
        total: grandTotal,
        paymentMethod,
        paidAt: new Date().toISOString()
      };

      const res = await apiService.processBillingCheckout(selectedAppt.id, billingData);
      
      if (res.success) {
        // Roster checkout notifications
        await apiService.addNotification({
          title: '💰 Payment Received',
          message: `Dues paid successfully for ${selectedAppt.patientName}. Invoice: ${invoiceNo}.`,
          type: 'billing',
          targetRoles: ['admin', 'receptionist']
        });

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
      // Toast Fallback mechanims
      alert('⚠️ POPUP BLOCKED: Please allow popups for this site in your browser to view and print the invoice receipt.');
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
              </tbody>
            </table>

            <!-- Summary Totals -->
            <div class="flex flex-col items-end border-t border-slate-100 pt-6 space-y-1.5 font-bold text-xs text-slate-500">
              <div class="flex gap-16 justify-between w-64">
                <span>Subtotal:</span>
                <span class="font-mono text-slate-700">₹${inv.total.toFixed(2)}</span>
              </div>
              <div class="flex gap-16 justify-between w-64">
                <span>GST Tax (0% CGST/SGST):</span>
                <span class="font-mono text-slate-700">₹0.00</span>
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
    <div className="space-y-6 max-w-5xl w-full text-left">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT CARD: Billing Queue (lg:col-span-5) */}
        <div className="elevated-surface p-6 lg:col-span-5 shadow-sm space-y-4 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="bg-indigo-500/10 p-2.5 rounded-xl text-indigo-650 shrink-0">
              <Receipt className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-850 dark:text-white font-heading">Billing Desk Queue</h3>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">Process invoices for completed consultations</p>
            </div>
          </div>

          <div className="w-full">
            <Input
              type="text"
              icon={Search}
              placeholder="Search active tokens..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
            {filteredQueue.length === 0 ? (
              <p className="text-center py-8 text-slate-400 dark:text-slate-500 text-xs font-medium">No patients waiting in billing queue.</p>
            ) : (
              filteredQueue.map(appt => {
                const isSelected = selectedAppt?.id === appt.id;
                return (
                  <div
                    key={appt.id}
                    onClick={() => handleSelectPatient(appt)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                      isSelected 
                        ? 'bg-blue-50/50 dark:bg-blue-950/20 border-blue-500/80 dark:border-blue-500/40 shadow-sm' 
                        : 'bg-slate-50 dark:bg-slate-950 border-slate-150 dark:border-slate-850 hover:bg-slate-100/50 dark:hover:bg-slate-900/40'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-mono text-emerald-600 dark:text-emerald-400 font-black text-[11px] block">{appt.token || 'OPD-N/A'}</span>
                        <h4 className="font-extrabold text-xs text-slate-800 dark:text-white mt-1">{appt.patientName}</h4>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold mt-0.5">Doctor: {appt.doctor}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        <Badge variant="indigo">
                          Checked Out
                        </Badge>
                        <span className="text-[9px] font-mono text-slate-400 dark:text-slate-500">{appt.time}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT CARD: Invoice Summary or Completed Preview (lg:col-span-7) */}
        <div className="lg:col-span-7 space-y-6">
          {selectedAppt ? (
            <Card className="space-y-5">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-150 dark:border-slate-800">
                <div className="bg-emerald-500/10 p-2.5 rounded-xl text-emerald-600 shrink-0">
                  <Calculator className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-850 dark:text-white font-heading">Calculate Patient Invoice</h3>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">Configure itemized clinical dues</p>
                </div>
              </div>

              {/* Patient brief info */}
              <div className="grid grid-cols-2 gap-4 text-xs font-semibold text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-250/10 dark:border-slate-800">
                <div>
                  <span className="text-[9px] text-slate-400 dark:text-slate-550 font-bold block uppercase">Checked In Patient</span>
                  <span className="text-slate-850 dark:text-white text-sm font-bold block mt-0.5">{selectedAppt.patientName}</span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 dark:text-slate-550 font-bold block uppercase">Diagnosed Roster Doc</span>
                  <span className="text-slate-850 dark:text-white block mt-0.5">{selectedAppt.doctor} ({selectedAppt.department})</span>
                </div>
              </div>

              {/* Bill Details */}
              <div className="space-y-3.5">
                <h4 className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Itemized Roster Charges (INR)</h4>
                
                <div className="grid grid-cols-3 gap-4">
                  <Input
                    label="Consultation Fee"
                    type="number"
                    value={charges.consultation}
                    onChange={(e) => setCharges({ ...charges, consultation: parseFloat(e.target.value) || 0 })}
                  />

                  <Input
                    label="Lab Diagnostics Fee"
                    type="number"
                    value={charges.lab}
                    onChange={(e) => setCharges({ ...charges, lab: parseFloat(e.target.value) || 0 })}
                  />

                  <Input
                    label="Registration Fee"
                    type="number"
                    value={charges.registration}
                    onChange={(e) => setCharges({ ...charges, registration: parseFloat(e.target.value) || 0 })}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Payment Channel</label>
                  <Select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    options={[
                      { value: 'upi', label: 'BHIM UPI QR' },
                      { value: 'card', label: 'Debit / Credit Card' },
                      { value: 'cash', label: 'Cash Desk' },
                      { value: 'insurance', label: 'PM-JAY Ayushman Card Scheme' }
                    ]}
                  />
                </div>
              </div>

              {/* Total Summary */}
              <div className="border-t border-slate-150 dark:border-slate-800 pt-4.5 flex justify-between items-center text-xs font-semibold text-slate-500 dark:text-slate-400">
                <div>
                  <span className="text-[9px] text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Grand total</span>
                  <span className="text-lg font-black text-slate-800 dark:text-white font-mono">
                    ₹{(charges.consultation + charges.lab + charges.registration).toFixed(2)}
                  </span>
                </div>
                
                <Button
                  onClick={handleCheckout}
                  variant="primary"
                  className="px-6 py-2.5 text-xs font-semibold shrink-0"
                >
                  Confirm & Discharge <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ) : invoicePreview ? (
            <Card className="space-y-5">
              <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/30 p-4 rounded-xl flex items-start gap-3.5 text-xs font-semibold text-emerald-800 dark:text-emerald-400">
                <Check className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-extrabold">Invoice paid & patient discharged.</h4>
                  <p className="text-[10px] text-emerald-650 dark:text-emerald-500 font-medium mt-0.5">Invoice #{invoicePreview.invoiceNo} successfully generated on National ABDM network.</p>
                </div>
              </div>

              {/* Invoice brief review */}
              <div className="border border-slate-200/60 dark:border-slate-800 rounded-2xl p-5 space-y-4">
                <div className="flex justify-between items-start pb-4.5 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <h4 className="font-black text-slate-850 dark:text-white text-base font-heading">Invoice Receipt Details</h4>
                    <p className="text-[10px] text-slate-400 dark:text-slate-550 font-mono mt-0.5">ID: #{invoicePreview.invoiceNo}</p>
                  </div>
                  <Button
                    onClick={() => handlePrintPDF(invoicePreview)}
                    variant="outline"
                    className="flex items-center gap-1.5 py-1.5 px-3"
                  >
                    <Printer className="h-4 w-4" /> Print PDF
                  </Button>
                </div>

                <div className="space-y-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                  <div className="flex justify-between">
                    <span>Patient Name</span>
                    <span className="text-slate-800 dark:text-white font-bold">{invoicePreview.patientName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>ABHA Health ID</span>
                    <span className="text-slate-800 dark:text-white font-mono">{invoicePreview.abhaId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Payment Channel</span>
                    <span className="text-indigo-650 dark:text-indigo-400 uppercase font-black">{invoicePreview.paymentMethod}</span>
                  </div>
                  
                  <div className="border-t border-slate-100 dark:border-slate-800 pt-3 space-y-1.5">
                    <div className="flex justify-between text-[10px]">
                      <span>Consultation Fee</span>
                      <span className="font-mono text-slate-700 dark:text-slate-300">₹{invoicePreview.charges.consultation.toFixed(2)}</span>
                    </div>
                    {invoicePreview.charges.lab > 0 && (
                      <div className="flex justify-between text-[10px]">
                        <span>Lab Diagnostics</span>
                        <span className="font-mono text-slate-700 dark:text-slate-300">₹{invoicePreview.charges.lab.toFixed(2)}</span>
                      </div>
                    )}
                    {invoicePreview.charges.registration > 0 && (
                      <div className="flex justify-between text-[10px]">
                        <span>Registration Fee</span>
                        <span className="font-mono text-slate-700 dark:text-slate-300">₹{invoicePreview.charges.registration.toFixed(2)}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-between items-center pt-3 border-t border-slate-200 dark:border-slate-800 text-sm">
                    <span className="text-slate-800 dark:text-white font-black">Grand Total Paid</span>
                    <span className="font-black text-emerald-600 dark:text-emerald-400 font-mono text-base">₹{invoicePreview.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </Card>
          ) : (
            <div className="text-center py-20 card-surface border border-slate-200 dark:border-slate-800 shadow-sm text-slate-400 dark:text-slate-500 font-medium">
              Select a checked-out patient to calculate billing dues.
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
