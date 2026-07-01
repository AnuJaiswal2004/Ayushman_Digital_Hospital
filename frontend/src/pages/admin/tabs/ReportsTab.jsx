import React, { useState, useEffect } from 'react';
import { 
  FileText, Download, Printer, User, DollarSign, Activity, 
  Building, Award, Search, Calendar, CheckCircle2, ChevronRight, TrendingUp
} from 'lucide-react';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell 
} from 'recharts';
import { apiService } from '../../../services/api.js';

export default function ReportsTab() {
  const [reportType, setReportType] = useState('patient'); // 'patient' | 'revenue' | 'doctor'
  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);

  // Patient Report specific state
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [patientSearch, setPatientSearch] = useState('');

  // Load datasets
  const loadData = async () => {
    const allPatients = await apiService.getPatients();
    const allAppts = await apiService.getAppointments();
    const allDoctors = await apiService.getDoctors();
    setPatients(allPatients);
    setAppointments(allAppts);
    setDoctors(allDoctors);
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter patients for selector
  const filteredPatients = patients.filter(p => 
    p.name.toLowerCase().includes(patientSearch.toLowerCase()) ||
    p.id.toLowerCase().includes(patientSearch.toLowerCase()) ||
    (p.abha && p.abha.includes(patientSearch))
  );

  const activePatient = patients.find(p => p.id === selectedPatientId);
  const activePatientAppts = appointments.filter(a => a.patientId === selectedPatientId);

  // --- REVENUE CALCS ---
  const completedBillingAppts = appointments.filter(a => a.billing);

  // 1. Monthly Revenue Summary
  const getMonthlyRevenue = () => {
    const monthlyMap = {};
    completedBillingAppts.forEach(appt => {
      const dateObj = new Date(appt.billing.paidAt || appt.date);
      const monthStr = dateObj.toLocaleString('default', { month: 'short', year: 'numeric' });
      const total = Number(appt.billing.total) || 0;
      const subtotal = Number(appt.billing.subtotal) || (total / 1.18);
      const gst = Number(appt.billing.gst) || (total - subtotal);

      if (!monthlyMap[monthStr]) {
        monthlyMap[monthStr] = { month: monthStr, count: 0, subtotal: 0, gst: 0, total: 0 };
      }
      monthlyMap[monthStr].count += 1;
      monthlyMap[monthStr].subtotal += subtotal;
      monthlyMap[monthStr].gst += gst;
      monthlyMap[monthStr].total += total;
    });

    return Object.values(monthlyMap);
  };

  const monthlyRevData = getMonthlyRevenue();

  // 2. Department Revenue Summary
  const getDepartmentRevenue = () => {
    const deptMap = {};
    completedBillingAppts.forEach(appt => {
      const dept = appt.department || 'general';
      const total = Number(appt.billing.total) || 0;
      if (!deptMap[dept]) {
        deptMap[dept] = { department: dept, count: 0, total: 0 };
      }
      deptMap[dept].count += 1;
      deptMap[dept].total += total;
    });

    const totalRevenueSum = completedBillingAppts.reduce((sum, a) => sum + (Number(a.billing.total) || 0), 0);

    return Object.values(deptMap).map(d => ({
      ...d,
      pct: totalRevenueSum > 0 ? ((d.total / totalRevenueSum) * 100).toFixed(1) : '0.0'
    }));
  };

  const deptRevData = getDepartmentRevenue();

  // Color Roster for Pie Charts
  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#3b82f6', '#8b5cf6', '#14b8a6'];

  // --- DOCTOR CALCS ---
  const getDoctorPerformance = () => {
    return doctors.map(doc => {
      const docAppts = appointments.filter(a => a.doctor === doc.name);
      const completed = docAppts.filter(a => a.status === 'completed');
      const uniquePatients = new Set(docAppts.map(a => a.patientId));
      const totalRevenue = docAppts.reduce((sum, a) => {
        return sum + (a.billing ? Number(a.billing.total) : 0);
      }, 0);

      return {
        id: doc.id,
        name: doc.name,
        specialization: doc.specialization,
        department: doc.department,
        patientsHandled: uniquePatients.size,
        consultations: completed.length,
        revenue: totalRevenue
      };
    });
  };

  const doctorReports = getDoctorPerformance();

  // --- CSV EXPORTER ---
  const exportToCSV = (data, filename, headers) => {
    let csvContent = "data:text/csv;charset=utf-8,";
    
    // Add headers
    csvContent += headers.join(",") + "\n";
    
    // Add rows
    data.forEach(row => {
      const rowStr = row.map(val => {
        const cleaned = String(val).replace(/"/g, '""');
        return `"${cleaned}"`;
      }).join(",");
      csvContent += rowStr + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- EXCEL (XLS) EXPORTER ---
  const exportToExcel = (tableHtml, filename) => {
    const excelTemplate = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <!--[if gte mso 9]>
        <xml>
          <x:ExcelWorkbook>
            <x:ExcelWorksheets>
              <x:ExcelWorksheet>
                <x:Name>Clinical Report</x:Name>
                <x:WorksheetOptions>
                  <x:DisplayGridlines/>
                </x:WorksheetOptions>
              </x:ExcelWorksheet>
            </x:ExcelWorksheets>
          </x:ExcelWorkbook>
        </xml>
        <![endif]-->
        <style>
          body { font-family: sans-serif; }
          table { border-collapse: collapse; width: 100%; }
          th { background-color: #4f46e5; color: white; font-weight: bold; text-align: left; padding: 8px; border: 1px solid #ddd; }
          td { padding: 8px; border: 1px solid #ddd; text-align: left; }
          .font-bold { font-weight: bold; }
          .text-right { text-align: right; }
          .text-center { text-align: center; }
          .bg-slate { background-color: #f1f5f9; }
        </style>
      </head>
      <body>
        ${tableHtml}
      </body>
      </html>
    `;

    const blob = new Blob([excelTemplate], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${filename}.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Trigger export for CSV
  const handleCSVTrigger = () => {
    if (reportType === 'patient') {
      if (!activePatient) return alert('Please select a patient first.');
      const headers = ["Appointment ID", "Doctor", "Date", "Time", "Type", "Status", "Total Charge (₹)", "Payment Method"];
      const rows = activePatientAppts.map(a => [
        a.id, a.doctor, a.date, a.time, a.type, a.status, 
        a.billing ? a.billing.total : 0, a.billing ? a.billing.paymentMethod : 'Unpaid'
      ]);
      exportToCSV(rows, `patient_${activePatient.id}_report`, headers);
    } 
    else if (reportType === 'revenue') {
      const headers = ["Month/Year", "Transactions", "Subtotal (₹)", "GST 18% (₹)", "Total Revenue (₹)"];
      const rows = monthlyRevData.map(r => [
        r.month, r.count, r.subtotal.toFixed(2), r.gst.toFixed(2), r.total.toFixed(2)
      ]);
      exportToCSV(rows, "monthly_revenue_report", headers);
    } 
    else if (reportType === 'doctor') {
      const headers = ["Doctor ID", "Doctor Name", "Specialization", "Department", "Patients Handled", "Consultations Completed", "Revenue Share (₹)"];
      const rows = doctorReports.map(d => [
        d.id, d.name, d.specialization, d.department, d.patientsHandled, d.consultations, d.revenue.toFixed(2)
      ]);
      exportToCSV(rows, "doctor_performance_report", headers);
    }
  };

  // Trigger export for Excel
  const handleExcelTrigger = () => {
    let htmlContent = "";
    let filename = "";

    if (reportType === 'patient') {
      if (!activePatient) return alert('Please select a patient first.');
      filename = `patient_${activePatient.id}_report`;
      htmlContent = `
        <h2>Patient Demographics</h2>
        <table>
          <tr><th colspan="2">Patient Health Card Profile</th></tr>
          <tr><td class="font-bold">Patient ID</td><td>${activePatient.id}</td></tr>
          <tr><td class="font-bold">Full Name</td><td>${activePatient.name}</td></tr>
          <tr><td class="font-bold">14-digit ABHA ID</td><td>${activePatient.abha || 'N/A'}</td></tr>
          <tr><td class="font-bold">Phone Number</td><td>${activePatient.phone}</td></tr>
          <tr><td class="font-bold">Date of Birth</td><td>${activePatient.dob}</td></tr>
          <tr><td class="font-bold">Gender</td><td>${activePatient.gender}</td></tr>
          <tr><td class="font-bold">Status</td><td>${activePatient.status || 'Active'}</td></tr>
        </table>
        
        <h2 style="margin-top:20px;">Vitals</h2>
        <table>
          <tr><th colspan="2">Last Recorded Vitals</th></tr>
          <tr><td class="font-bold">Blood Pressure</td><td>${activePatient.emr?.bloodPressure || 'N/A'}</td></tr>
          <tr><td class="font-bold">Blood Sugar (mg/dL)</td><td>${activePatient.emr?.sugar || 'N/A'}</td></tr>
          <tr><td class="font-bold">Weight (kg)</td><td>${activePatient.emr?.weight || 'N/A'}</td></tr>
          <tr><td class="font-bold">Height (cm)</td><td>${activePatient.emr?.height || 'N/A'}</td></tr>
        </table>

        <h2 style="margin-top:20px;">Appointments History</h2>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Doctor</th>
              <th>Date</th>
              <th>Time</th>
              <th>Type</th>
              <th>Status</th>
              <th>Total Bill</th>
              <th>Payment Method</th>
            </tr>
          </thead>
          <tbody>
            ${activePatientAppts.map(a => `
              <tr>
                <td>${a.id}</td>
                <td>${a.doctor}</td>
                <td>${a.date}</td>
                <td>${a.time}</td>
                <td>${a.type}</td>
                <td>${a.status}</td>
                <td>₹${a.billing ? a.billing.total.toFixed(2) : '0.00'}</td>
                <td>${a.billing ? a.billing.paymentMethod.toUpperCase() : 'UNPAID'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    } 
    else if (reportType === 'revenue') {
      filename = "monthly_revenue_report";
      htmlContent = `
        <h2>Monthly Revenue Index</h2>
        <table>
          <thead>
            <tr>
              <th>Month/Year</th>
              <th class="text-center">Transactions</th>
              <th class="text-right">Subtotal</th>
              <th class="text-right">GST (18%)</th>
              <th class="text-right">Total Revenue</th>
            </tr>
          </thead>
          <tbody>
            ${monthlyRevData.map(r => `
              <tr>
                <td>${r.month}</td>
                <td class="text-center">${r.count}</td>
                <td class="text-right">₹${r.subtotal.toFixed(2)}</td>
                <td class="text-right">₹${r.gst.toFixed(2)}</td>
                <td class="text-right" style="font-weight:bold;color:#16a34a;">₹${r.total.toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <h2 style="margin-top:20px;">Department Revenue Share</h2>
        <table>
          <thead>
            <tr>
              <th>Department</th>
              <th class="text-center">Visits Count</th>
              <th class="text-right">Total Collection</th>
              <th class="text-right">Percentage Share</th>
            </tr>
          </thead>
          <tbody>
            ${deptRevData.map(d => `
              <tr>
                <td style="text-transform:capitalize;">${d.department}</td>
                <td class="text-center">${d.count}</td>
                <td class="text-right">₹${d.total.toFixed(2)}</td>
                <td class="text-right">${d.pct}%</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    } 
    else if (reportType === 'doctor') {
      filename = "doctor_performance_report";
      htmlContent = `
        <h2>Practitioner Clinical Audit</h2>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Doctor Name</th>
              <th>Specialization</th>
              <th>Department</th>
              <th class="text-center">Patients Handled</th>
              <th class="text-center">Consultations Completed</th>
              <th class="text-right">Revenue Share</th>
            </tr>
          </thead>
          <tbody>
            ${doctorReports.map(d => `
              <tr>
                <td>${d.id}</td>
                <td>${d.name}</td>
                <td>${d.specialization}</td>
                <td style="text-transform:capitalize;">${d.department}</td>
                <td class="text-center">${d.patientsHandled}</td>
                <td class="text-center">${d.consultations}</td>
                <td class="text-right">₹${d.revenue.toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    }

    exportToExcel(htmlContent, filename);
  };

  // --- PDF PRINT PREVIEW EXPORTER ---
  const handlePrintPDF = () => {
    const printWindow = window.open('', '_blank', 'width=900,height=700');
    if (!printWindow) {
      alert('Please allow popups to generate print previews');
      return;
    }

    let innerHTML = "";
    if (reportType === 'patient') {
      if (!activePatient) return alert('Select a patient first');
      innerHTML = `
        <div class="space-y-6">
          <div class="border-b pb-4 flex justify-between items-center">
            <div>
              <h1 class="text-2xl font-black text-indigo-700">CLINICAL PATIENT REPORT</h1>
              <p class="text-xs text-slate-400 font-bold uppercase tracking-wider mt-1">Ayushman Digital Health Platform</p>
            </div>
            <div class="text-right">
              <span class="text-xs font-mono font-bold text-slate-800">PATIENT ID: ${activePatient.id}</span>
              <p class="text-[10px] text-slate-400 mt-1">Generated: ${new Date().toLocaleDateString()}</p>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-5 rounded-2xl border border-slate-100 font-semibold">
            <div>
              <span class="text-[9px] text-slate-400 font-bold block uppercase">Demographic Information</span>
              <p class="text-slate-800 text-sm font-black mt-1">${activePatient.name}</p>
              <p class="mt-1 font-mono text-slate-500">ABHA: ${activePatient.abha || 'N/A'}</p>
              <p class="mt-1 text-slate-500">Phone: ${activePatient.phone}</p>
            </div>
            <div>
              <span class="text-[9px] text-slate-400 font-bold block uppercase">Health Details</span>
              <p class="text-slate-800 mt-1">DOB: ${new Date(activePatient.dob).toLocaleDateString()}</p>
              <p class="mt-1 capitalize">Gender: ${activePatient.gender}</p>
              <p class="mt-1">Status: <strong class="text-emerald-600">${activePatient.status || 'Active'}</strong></p>
            </div>
          </div>

          <div>
            <h3 class="text-xs font-black text-slate-800 uppercase tracking-widest border-b pb-1 mb-2">LAST RECORDED VITALS</h3>
            <div class="grid grid-cols-4 gap-2 text-center text-xs font-bold text-slate-655">
              <div class="bg-slate-50 p-3.5 border rounded-xl">
                <span class="text-[9px] text-slate-400 block uppercase font-bold">BP</span>
                <span class="text-slate-800 text-sm font-black font-mono block mt-1">${activePatient.emr?.bloodPressure || 'N/A'}</span>
              </div>
              <div class="bg-slate-50 p-3.5 border rounded-xl">
                <span class="text-[9px] text-slate-400 block uppercase font-bold">Sugar (mg/dL)</span>
                <span class="text-slate-800 text-sm font-black font-mono block mt-1">${activePatient.emr?.sugar || 'N/A'}</span>
              </div>
              <div class="bg-slate-50 p-3.5 border rounded-xl">
                <span class="text-[9px] text-slate-400 block uppercase font-bold">Weight</span>
                <span class="text-slate-800 text-sm font-black font-mono block mt-1">${activePatient.emr?.weight ? activePatient.emr.weight + ' kg' : 'N/A'}</span>
              </div>
              <div class="bg-slate-50 p-3.5 border rounded-xl">
                <span class="text-[9px] text-slate-400 block uppercase font-bold">Height</span>
                <span class="text-slate-800 text-sm font-black font-mono block mt-1">${activePatient.emr?.height ? activePatient.emr.height + ' cm' : 'N/A'}</span>
              </div>
            </div>
          </div>

          <div>
            <h3 class="text-xs font-black text-slate-800 uppercase tracking-widest border-b pb-1 mb-2">EMR MEDICAL RISKS</h3>
            <div class="grid grid-cols-3 gap-4 text-xs font-semibold">
              <div class="p-3 bg-red-50 border border-red-100 rounded-xl">
                <span class="text-[9px] text-red-500 font-bold block uppercase">Allergies & Reactions</span>
                <p class="text-red-750 font-bold mt-1">${activePatient.emr?.allergies?.join(', ') || 'None reported'}</p>
              </div>
              <div class="p-3 bg-amber-50 border border-amber-100 rounded-xl">
                <span class="text-[9px] text-amber-500 font-bold block uppercase">Chronic Diseases</span>
                <p class="text-amber-750 font-bold mt-1">${activePatient.emr?.diseases?.join(', ') || 'No active chronic diagnoses'}</p>
              </div>
              <div class="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                <span class="text-[9px] text-slate-500 font-bold block uppercase">Surgery History</span>
                <p class="text-slate-750 font-bold mt-1">${activePatient.emr?.surgeries?.join(', ') || 'No clinical surgical records'}</p>
              </div>
            </div>
          </div>

          <div>
            <h3 class="text-xs font-black text-slate-800 uppercase tracking-widest border-b pb-1 mb-2">APPOINTMENTS HISTORY</h3>
            <table class="w-full text-xs text-left">
              <thead>
                <tr class="border-b text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                  <th class="py-2">Visit ID</th>
                  <th class="py-2">Doctor</th>
                  <th class="py-2">Date/Time</th>
                  <th class="py-2">Type</th>
                  <th class="py-2">Status</th>
                  <th class="py-2 text-right">Fee Charge</th>
                </tr>
              </thead>
              <tbody class="divide-y text-slate-600 font-medium">
                ${activePatientAppts.map(a => `
                  <tr>
                    <td class="py-3.5 font-mono text-slate-900">${a.id}</td>
                    <td class="py-3.5 text-slate-800 font-bold">${a.doctor}</td>
                    <td class="py-3.5">${new Date(a.date).toLocaleDateString()} - ${a.time}</td>
                    <td class="py-3.5 capitalize">${a.type}</td>
                    <td class="py-3.5 uppercase text-[10px] font-bold">${a.status}</td>
                    <td class="py-3.5 text-right font-mono font-bold text-slate-800">₹${a.billing ? a.billing.total.toFixed(2) : '0.00'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;
    } 
    else if (reportType === 'revenue') {
      innerHTML = `
        <div class="space-y-6">
          <div class="border-b pb-4 flex justify-between items-center">
            <div>
              <h1 class="text-2xl font-black text-indigo-700 font-heading">FINANCIAL REVENUE REPORT</h1>
              <p class="text-xs text-slate-400 font-bold uppercase tracking-wider mt-1">Hospital Collections Audit Desk</p>
            </div>
            <div class="text-right">
              <span class="text-xs font-mono font-bold text-slate-800">TAX AUDIT FILE</span>
              <p class="text-[10px] text-slate-400 mt-1">Generated: ${new Date().toLocaleDateString()}</p>
            </div>
          </div>

          <div>
            <h3 class="text-xs font-black text-slate-800 uppercase tracking-widest border-b pb-1 mb-2">MONTHLY REVENUE INDEX</h3>
            <table class="w-full text-xs text-left">
              <thead>
                <tr class="border-b text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                  <th class="py-2">Month/Year</th>
                  <th class="py-2 text-center">Transactions Count</th>
                  <th class="py-2 text-right">Subtotal</th>
                  <th class="py-2 text-right">GST (18%)</th>
                  <th class="py-2 text-right">Total Revenue</th>
                </tr>
              </thead>
              <tbody class="divide-y text-slate-655 font-medium">
                ${monthlyRevData.map(r => `
                  <tr>
                    <td class="py-3 font-bold text-slate-800">${r.month}</td>
                    <td class="py-3 text-center">${r.count}</td>
                    <td class="py-3 text-right font-mono">₹${r.subtotal.toFixed(2)}</td>
                    <td class="py-3 text-right font-mono">₹${r.gst.toFixed(2)}</td>
                    <td class="py-3 text-right font-mono font-black text-emerald-650">₹${r.total.toFixed(2)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <div class="pt-6">
            <h3 class="text-xs font-black text-slate-800 uppercase tracking-widest border-b pb-1 mb-2">DEPARTMENT COLLECTION SUMMARY</h3>
            <table class="w-full text-xs text-left">
              <thead>
                <tr class="border-b text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                  <th class="py-2">Department</th>
                  <th class="py-2 text-center">Visits Count</th>
                  <th class="py-2 text-right">Total Collections</th>
                  <th class="py-2 text-right">Percentage Share</th>
                </tr>
              </thead>
              <tbody class="divide-y text-slate-655 font-medium">
                ${deptRevData.map(d => `
                  <tr>
                    <td class="py-3 font-bold text-slate-800 capitalize">${d.department}</td>
                    <td class="py-3 text-center">${d.count}</td>
                    <td class="py-3 text-right font-mono">₹${d.total.toFixed(2)}</td>
                    <td class="py-3 text-right font-mono font-bold text-indigo-600">${d.pct}%</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;
    } 
    else if (reportType === 'doctor') {
      innerHTML = `
        <div class="space-y-6">
          <div class="border-b pb-4 flex justify-between items-center">
            <div>
              <h1 class="text-2xl font-black text-indigo-700">CLINICAL PRACTITIONER AUDIT</h1>
              <p class="text-xs text-slate-400 font-bold uppercase tracking-wider mt-1">Doctor Performance & handled registers</p>
            </div>
            <div class="text-right">
              <span class="text-xs font-mono font-bold text-slate-800">STAFF PERFORMANCE MATRIX</span>
              <p class="text-[10px] text-slate-400 mt-1">Generated: ${new Date().toLocaleDateString()}</p>
            </div>
          </div>

          <table class="w-full text-xs text-left">
            <thead>
              <tr class="border-b text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                <th class="py-2">ID</th>
                <th class="py-2">Doctor Name</th>
                <th class="py-2">Specialization</th>
                <th class="py-2">Department</th>
                <th class="py-2 text-center">Patients Handled</th>
                <th class="py-2 text-center">Consultations Completed</th>
                <th class="py-2 text-right">Billing Volume</th>
              </tr>
            </thead>
            <tbody class="divide-y text-slate-655 font-medium">
              ${doctorReports.map(d => `
                <tr>
                  <td class="py-3.5 font-mono text-slate-900">${d.id}</td>
                  <td class="py-3.5 font-bold text-slate-800">${d.name}</td>
                  <td class="py-3.5">${d.specialization}</td>
                  <td class="py-3.5 capitalize">${d.department}</td>
                  <td class="py-3.5 text-center font-mono font-bold">${d.patientsHandled}</td>
                  <td class="py-3.5 text-center font-mono font-bold">${d.consultations}</td>
                  <td class="py-3.5 text-right font-mono font-bold text-slate-800">₹${d.revenue.toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    }

    const htmlContent = `
      <html>
        <head>
          <title>Clinical Report Preview</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
            @media print {
              body { padding: 15px; background-color: white !important; color: black !important; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body class="bg-slate-50 p-8 text-slate-800">
          <div class="max-w-4xl mx-auto bg-white border rounded-3xl p-8 shadow-sm">
            ${innerHTML}
            
            <div class="border-t mt-12 pt-6 text-center text-[10px] text-slate-400 font-semibold no-print flex justify-between items-center">
              <span>National Ayushman Bharat Digital Mission (ABDM) Compliance</span>
              <button onclick="window.print()" class="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2 rounded-xl text-xs cursor-pointer shadow-md">
                Trigger Printer / Export PDF
              </button>
            </div>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6 max-w-6xl w-full text-slate-850 dark:text-slate-200 transition-colors">
      
      {/* Selection Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h3 className="font-extrabold text-sm text-slate-900 dark:text-white font-heading">Reports & Clinical Analytics</h3>
          <p className="text-[10px] text-slate-400 dark:text-slate-400 font-bold uppercase tracking-wider mt-0.5">Generate, audit, and export patient files and revenue parameters</p>
        </div>

        {/* Buttons to select reports */}
        <div className="flex bg-slate-100 dark:bg-slate-950 p-1.5 rounded-xl border border-slate-200/50 dark:border-slate-800/60 font-semibold text-[11px] gap-1 shrink-0">
          <button
            onClick={() => setReportType('patient')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              reportType === 'patient'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Patient Report
          </button>
          <button
            onClick={() => setReportType('revenue')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              reportType === 'revenue'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Revenue Report
          </button>
          <button
            onClick={() => setReportType('doctor')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              reportType === 'doctor'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Doctor Report
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: Controls & Details depending on Report Type */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-5">
          
          {reportType === 'patient' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2.5 pb-2.5 border-b border-slate-100 dark:border-slate-800">
                <User className="h-4.5 w-4.5 text-indigo-500" />
                <h4 className="font-bold text-xs text-slate-850 dark:text-white uppercase tracking-wider">Patient Selector</h4>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search name, phone, or ID..."
                  value={patientSearch}
                  onChange={(e) => setPatientSearch(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs font-semibold outline-none focus:border-indigo-500 text-slate-850 dark:text-white"
                />
              </div>

              <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                {filteredPatients.length === 0 ? (
                  <p className="text-center py-6 text-slate-400 text-xs font-medium">No matches found.</p>
                ) : (
                  filteredPatients.map(p => (
                    <div
                      key={p.id}
                      onClick={() => setSelectedPatientId(p.id)}
                      className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                        selectedPatientId === p.id 
                          ? 'bg-indigo-500/10 border-indigo-500/80' 
                          : 'bg-slate-50/50 dark:bg-slate-950/40 border-slate-150 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                      }`}
                    >
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-slate-800 dark:text-white">{p.name}</span>
                        <span className="font-mono text-[10px] text-slate-400 font-bold">{p.id}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 block mt-0.5 font-mono">ABHA: {p.abha || 'N/A'}</span>
                    </div>
                  ))
                )}
              </div>

              {activePatient && (
                <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-250/50 dark:border-slate-800/80 text-[11px] font-semibold text-slate-550 dark:text-slate-400 space-y-2">
                  <div className="flex justify-between">
                    <span>Active Profile:</span>
                    <span className="text-slate-800 dark:text-white font-bold">{activePatient.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Consultations:</span>
                    <span className="text-slate-800 dark:text-white font-mono font-bold">{activePatientAppts.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Registered On:</span>
                    <span className="text-slate-800 dark:text-white">{new Date(activePatient.registrationDate || Date.now()).toLocaleDateString()}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {reportType === 'revenue' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2.5 pb-2.5 border-b border-slate-100 dark:border-slate-800">
                <DollarSign className="h-4.5 w-4.5 text-emerald-500" />
                <h4 className="font-bold text-xs text-slate-850 dark:text-white uppercase tracking-wider">Revenue Parameters</h4>
              </div>

              <div className="space-y-3.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
                <div className="bg-emerald-500/10 border border-emerald-500/15 p-4 rounded-2xl">
                  <span className="text-[9px] text-emerald-650 dark:text-emerald-400 font-black block uppercase tracking-wider">Total Collection</span>
                  <span className="text-2xl font-black text-slate-800 dark:text-white font-mono block mt-1.5">
                    ₹{completedBillingAppts.reduce((sum, a) => sum + (Number(a.billing.total) || 0), 0).toFixed(2)}
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-1">Inclusive of GST calculations</span>
                </div>

                <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-800 space-y-2">
                  <div className="flex justify-between">
                    <span>Total Checkouts:</span>
                    <span className="text-slate-800 dark:text-white font-black font-mono">{completedBillingAppts.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Subtotal Volume:</span>
                    <span className="text-slate-800 dark:text-white font-bold font-mono">
                      ₹{monthlyRevData.reduce((sum, m) => sum + m.subtotal, 0).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>GST Collected (18%):</span>
                    <span className="text-slate-800 dark:text-white font-bold font-mono">
                      ₹{monthlyRevData.reduce((sum, m) => sum + m.gst, 0).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {reportType === 'doctor' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2.5 pb-2.5 border-b border-slate-100 dark:border-slate-800">
                <Award className="h-4.5 w-4.5 text-amber-500" />
                <h4 className="font-bold text-xs text-slate-850 dark:text-white uppercase tracking-wider">Clinical Audit Parameters</h4>
              </div>

              <div className="space-y-3.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
                <div className="bg-indigo-500/10 border border-indigo-500/15 p-4 rounded-2xl">
                  <span className="text-[9px] text-indigo-600 dark:text-indigo-400 font-black block uppercase tracking-wider">Total Active Doctors</span>
                  <span className="text-2xl font-black text-slate-800 dark:text-white font-mono block mt-1.5">{doctors.length}</span>
                  <span className="text-[10px] text-slate-400 block mt-1">Across all hospital specialties</span>
                </div>

                <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-800 space-y-2">
                  <div className="flex justify-between">
                    <span>Avg Consults/Doc:</span>
                    <span className="text-slate-800 dark:text-white font-bold font-mono">
                      {doctors.length > 0 ? (appointments.filter(a => a.status === 'completed').length / doctors.length).toFixed(1) : 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Avg Revenue/Doc:</span>
                    <span className="text-slate-800 dark:text-white font-bold font-mono">
                      ₹{doctors.length > 0 ? (completedBillingAppts.reduce((sum, a) => sum + (Number(a.billing.total) || 0), 0) / doctors.length).toFixed(2) : '0.00'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action triggers */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Export Formats</span>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={handlePrintPDF}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-1 rounded-xl text-[10px] cursor-pointer shadow flex items-center justify-center gap-1 transition-all"
              >
                <Printer className="h-3 w-3" /> PDF
              </button>
              <button
                onClick={handleExcelTrigger}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-1 rounded-xl text-[10px] cursor-pointer shadow flex items-center justify-center gap-1 transition-all"
              >
                <Download className="h-3 w-3" /> Excel
              </button>
              <button
                onClick={handleCSVTrigger}
                className="bg-slate-700 hover:bg-slate-850 text-white font-bold py-2 px-1 rounded-xl text-[10px] cursor-pointer shadow flex items-center justify-center gap-1 transition-all"
              >
                <FileText className="h-3 w-3" /> CSV
              </button>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: Viewport containing Data visualization & Tables */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm min-h-[480px] flex flex-col">
          
          {reportType === 'patient' && (
            <div className="flex-1 flex flex-col justify-between">
              {activePatient ? (
                <div className="space-y-6 text-left">
                  <div className="pb-3.5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-start">
                    <div>
                      <h4 className="font-extrabold text-sm text-slate-850 dark:text-white font-heading">{activePatient.name}</h4>
                      <p className="text-[10px] text-slate-400 mt-0.5">ABHA Locker Reference: <span className="font-mono text-slate-550 dark:text-slate-300 font-semibold">{activePatient.abha || 'N/A'}</span></p>
                    </div>
                    <span className="bg-emerald-500/10 text-emerald-650 text-[8px] font-black px-2 py-0.5 rounded border border-emerald-500/20 uppercase tracking-wider">
                      {activePatient.status || 'Active'}
                    </span>
                  </div>

                  {/* Vitals Summary */}
                  <div className="space-y-2">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Last Recorded Body Stats</span>
                    <div className="grid grid-cols-4 gap-3 text-center">
                      <div className="bg-slate-50 dark:bg-slate-950 p-3.5 rounded-2xl border border-slate-200/60 dark:border-slate-800/80">
                        <span className="text-[8px] text-slate-400 dark:text-slate-400 block uppercase font-bold">BP</span>
                        <span className="text-slate-800 dark:text-white text-xs font-black font-mono block mt-1">{activePatient.emr?.bloodPressure || 'N/A'}</span>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-950 p-3.5 rounded-2xl border border-slate-200/60 dark:border-slate-800/80">
                        <span className="text-[8px] text-slate-400 dark:text-slate-400 block uppercase font-bold">Sugar</span>
                        <span className="text-slate-800 dark:text-white text-xs font-black font-mono block mt-1">{activePatient.emr?.sugar || 'N/A'}</span>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-950 p-3.5 rounded-2xl border border-slate-200/60 dark:border-slate-800/80">
                        <span className="text-[8px] text-slate-400 dark:text-slate-400 block uppercase font-bold">Weight</span>
                        <span className="text-slate-800 dark:text-white text-xs font-black font-mono block mt-1">{activePatient.emr?.weight ? activePatient.emr.weight + ' kg' : 'N/A'}</span>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-950 p-3.5 rounded-2xl border border-slate-200/60 dark:border-slate-800/80">
                        <span className="text-[8px] text-slate-400 dark:text-slate-400 block uppercase font-bold">Height</span>
                        <span className="text-slate-800 dark:text-white text-xs font-black font-mono block mt-1">{activePatient.emr?.height ? activePatient.emr.height + ' cm' : 'N/A'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Diagnoses and Prescriptions list */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-800">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Diagnosed Diseases</span>
                      <div className="flex flex-wrap gap-1">
                        {activePatient.emr?.diseases?.length > 0 ? (
                          activePatient.emr.diseases.map(d => (
                            <span key={d} className="bg-amber-100 text-amber-700 text-[9px] font-bold px-2 py-0.5 rounded-md">{d}</span>
                          ))
                        ) : (
                          <span className="text-slate-400 text-[10px] font-medium">No active chronic records</span>
                        )}
                      </div>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-800">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Active Allergies</span>
                      <div className="flex flex-wrap gap-1">
                        {activePatient.emr?.allergies?.length > 0 ? (
                          activePatient.emr.allergies.map(a => (
                            <span key={a} className="bg-rose-100 text-rose-700 text-[9px] font-bold px-2 py-0.5 rounded-md">{a}</span>
                          ))
                        ) : (
                          <span className="text-slate-400 text-[10px] font-medium">No known medical allergies</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Appointments Table */}
                  <div className="space-y-2">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Appointments Ledger</span>
                    <div className="max-h-40 overflow-y-auto pr-1">
                      <table className="w-full text-[11px] text-left">
                        <thead>
                          <tr className="border-b border-slate-200 dark:border-slate-800 text-[8px] font-bold text-slate-400 uppercase tracking-wider">
                            <th className="pb-1">Doctor</th>
                            <th className="pb-1">Date</th>
                            <th className="pb-1">Type</th>
                            <th className="pb-1">Status</th>
                            <th className="pb-1 text-right">Dues Paid</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium text-slate-600 dark:text-slate-400">
                          {activePatientAppts.length === 0 ? (
                            <tr>
                              <td colSpan="5" className="py-4 text-center text-slate-400">No scheduled visits.</td>
                            </tr>
                          ) : (
                            activePatientAppts.map(a => (
                              <tr key={a.id} className="hover:bg-slate-50 dark:hover:bg-slate-950/40">
                                <td className="py-2.5 font-bold text-slate-800 dark:text-white">{a.doctor}</td>
                                <td className="py-2.5 font-mono">{a.date}</td>
                                <td className="py-2.5 uppercase text-[9px]">{a.type}</td>
                                <td className="py-2.5">
                                  <span className={`px-1.5 py-0.2 rounded text-[8px] font-bold uppercase ${
                                    a.status === 'completed' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400'
                                  }`}>
                                    {a.status}
                                  </span>
                                </td>
                                <td className="py-2.5 text-right font-mono font-bold text-slate-800 dark:text-white">
                                  ₹{a.billing ? a.billing.total.toFixed(2) : '0.00'}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-400 text-xs font-semibold py-10 space-y-2">
                  <User className="h-10 w-10 text-slate-300" />
                  <p>Choose a patient from the demographic search index to query reports.</p>
                </div>
              )}
            </div>
          )}

          {reportType === 'revenue' && (
            <div className="space-y-6 text-left">
              <div className="pb-3 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <h4 className="font-extrabold text-sm text-slate-850 dark:text-white font-heading">Hospital Collections Audit</h4>
                <TrendingUp className="h-4.5 w-4.5 text-emerald-500" />
              </div>

              {/* Chart visualization */}
              <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-800 space-y-3">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Department collections share</span>
                <div className="h-44 w-full flex items-center justify-center">
                  {deptRevData.length === 0 ? (
                    <p className="text-slate-400 text-xs font-medium">No transactions recorded for department visualization.</p>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={deptRevData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="department" style={{ fontSize: 9, textTransform: 'capitalize' }} />
                        <YAxis style={{ fontSize: 9 }} />
                        <Tooltip contentStyle={{ fontSize: 11 }} />
                        <Bar dataKey="total" fill="#4f46e5" radius={[4, 4, 0, 0]}>
                          {deptRevData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              {/* Monthly totals ledger */}
              <div className="space-y-2">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Monthly ledger index</span>
                <div className="overflow-x-auto max-h-40">
                  <table className="w-full text-[11px] text-left">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 text-[8px] font-bold text-slate-400 uppercase tracking-wider">
                        <th className="pb-1.5">Month</th>
                        <th className="pb-1.5 text-center">Receipts</th>
                        <th className="pb-1.5 text-right">Subtotal</th>
                        <th className="pb-1.5 text-right">GST (18%)</th>
                        <th className="pb-1.5 text-right">Total Collection</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium text-slate-655 dark:text-slate-400">
                      {monthlyRevData.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="py-4 text-center text-slate-400">No checkout transactions on record.</td>
                        </tr>
                      ) : (
                        monthlyRevData.map(m => (
                          <tr key={m.month} className="hover:bg-slate-50 dark:hover:bg-slate-950/40">
                            <td className="py-2.5 font-bold text-slate-800 dark:text-white">{m.month}</td>
                            <td className="py-2.5 text-center">{m.count}</td>
                            <td className="py-2.5 text-right font-mono">₹{m.subtotal.toFixed(2)}</td>
                            <td className="py-2.5 text-right font-mono">₹{m.gst.toFixed(2)}</td>
                            <td className="py-2.5 text-right font-mono font-black text-emerald-650 dark:text-emerald-400">₹{m.total.toFixed(2)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {reportType === 'doctor' && (
            <div className="space-y-6 text-left flex-1 flex flex-col justify-between">
              <div>
                <div className="pb-3 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                  <h4 className="font-extrabold text-sm text-slate-850 dark:text-white font-heading">Clinical Performance Matrix</h4>
                  <Award className="h-4.5 w-4.5 text-amber-500" />
                </div>

                <div className="overflow-x-auto max-h-80 mt-4">
                  <table className="w-full text-[11px] text-left">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 text-[8px] font-bold text-slate-400 uppercase tracking-wider">
                        <th className="pb-2">Practitioner</th>
                        <th className="pb-2">Department</th>
                        <th className="pb-2 text-center">Patients Handled</th>
                        <th className="pb-2 text-center">Completed Consults</th>
                        <th className="pb-2 text-right">Revenue Contributed</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium text-slate-655 dark:text-slate-400">
                      {doctorReports.map(d => (
                        <tr key={d.id} className="hover:bg-slate-50 dark:hover:bg-slate-950/40">
                          <td className="py-3 font-bold text-slate-800 dark:text-white">{d.name}</td>
                          <td className="py-3 capitalize text-slate-500 dark:text-slate-400 text-[10px]">{d.department}</td>
                          <td className="py-3 text-center font-mono font-bold text-slate-800 dark:text-white">{d.patientsHandled}</td>
                          <td className="py-3 text-center font-mono font-bold text-slate-800 dark:text-white">{d.consultations}</td>
                          <td className="py-3 text-right font-mono font-bold text-slate-800 dark:text-white">₹{d.revenue.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 text-center border-t border-slate-100 dark:border-slate-800 pt-4 mt-2">
                Metrics dynamically consolidated based on checking active patient consultation indices in EMR.
              </div>
            </div>
          )}

        </div>

      </div>
      
    </div>
  );
}
