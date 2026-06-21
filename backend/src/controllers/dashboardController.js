import Patient from '../models/Patient.js';
import Doctor from '../models/Doctor.js';
import Appointment from '../models/Appointment.js';
import Visit from '../models/Visit.js';
import Department from '../models/Department.js';
import Billing from '../models/Billing.js';

class DashboardController {
  async getStats(req, res, next) {
    try {
      const today = new Date().toISOString().split('T')[0];

      const totalPatients = await Patient.countDocuments();
      const doctorsCount = await Doctor.countDocuments();
      const departmentsCount = await Department.countDocuments();

      // Today's stats
      const todayAppointmentsCount = await Appointment.countDocuments({ date: today });
      const todayVisitsCount = await Visit.countDocuments({ date: today });
      
      const totalToday = todayAppointmentsCount + todayVisitsCount;

      // Active beds
      const departments = await Department.find({});
      const totalBeds = departments.reduce((acc, curr) => acc + curr.totalBeds, 0);
      const occupiedBeds = departments.reduce((acc, curr) => acc + curr.occupiedBeds, 0);

      // Queue status counts
      const waitingCount = await Visit.countDocuments({ currentStep: 'vitals', status: 'scheduled' });
      const consultingCount = await Visit.countDocuments({ currentStep: 'consultation', status: 'scheduled' });
      const billingCount = await Visit.countDocuments({ currentStep: 'billing', status: 'scheduled' });

      res.status(200).json({
        success: true,
        stats: {
          totalPatients,
          doctorsCount,
          departmentsCount,
          todayAppointments: totalToday,
          beds: {
            total: totalBeds,
            occupied: occupiedBeds,
            available: totalBeds - occupiedBeds
          },
          queue: {
            vitals: waitingCount,
            consultation: consultingCount,
            billing: billingCount,
            total: waitingCount + consultingCount + billingCount
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async getAnalytics(req, res, next) {
    try {
      // Grouping bookings by type
      const opdCount = await Visit.countDocuments({ type: 'opd' }) + await Appointment.countDocuments({ type: 'opd' });
      const teleCount = await Visit.countDocuments({ type: 'telemedicine' }) + await Appointment.countDocuments({ type: 'telemedicine' });
      const emgCount = await Visit.countDocuments({ type: 'emergency' }) + await Appointment.countDocuments({ type: 'emergency' });

      // Financials
      const bills = await Billing.find({ status: 'paid' });
      const totalRevenue = bills.reduce((acc, curr) => acc + curr.totalAmount, 0);
      
      // Payment methods breakdown
      const paymentBreakdown = { cash: 0, card: 0, upi: 0, insurance: 0 };
      bills.forEach(bill => {
        if (paymentBreakdown[bill.paymentMethod] !== undefined) {
          paymentBreakdown[bill.paymentMethod] += bill.totalAmount;
        }
      });

      // Department performance
      const departments = await Department.find({});
      const deptAnalytics = await Promise.all(departments.map(async (dept) => {
        const visitCount = await Visit.countDocuments({ department: dept.key });
        const apptCount = await Appointment.countDocuments({ department: dept.key });
        return {
          name: dept.name,
          key: dept.key,
          totalVisits: visitCount + apptCount,
          occupiedBeds: dept.occupiedBeds
        };
      }));

      res.status(200).json({
        success: true,
        analytics: {
          types: {
            opd: opdCount,
            telemedicine: teleCount,
            emergency: emgCount
          },
          revenue: {
            total: totalRevenue,
            breakdown: paymentBreakdown
          },
          departments: deptAnalytics
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async getQueue(req, res, next) {
    try {
      const activeVisits = await Visit.find({
        status: 'scheduled',
        currentStep: { $in: ['vitals', 'consultation', 'billing'] }
      }).sort({ createdAt: 1 });

      res.status(200).json({
        success: true,
        queue: activeVisits
      });
    } catch (error) {
      next(error);
    }
  }

  async advanceQueue(req, res, next) {
    try {
      const { visitId } = req.params;
      const visit = await Visit.findOne({ $or: [{ id: visitId }, { token: visitId }] });
      if (!visit) throw new Error('Visit not found');

      let nextStep = '';
      if (visit.currentStep === 'vitals') {
        nextStep = 'consultation';
      } else if (visit.currentStep === 'consultation') {
        nextStep = 'billing';
      } else if (visit.currentStep === 'billing') {
        nextStep = 'completed';
        visit.status = 'completed';
      }

      if (nextStep) {
        visit.currentStep = nextStep;
        await visit.save();
      }

      res.status(200).json({
        success: true,
        message: `Queue advanced to step: ${nextStep || 'completed'}`,
        visit
      });
    } catch (error) {
      res.status(400);
      next(error);
    }
  }
}

export default new DashboardController();
