import Notification from '../models/Notification.js';
import Visit from '../models/Visit.js';

class NotificationService {
  async getNotifications() {
    // Run automated overdue invoice check before returning
    try {
      const visits = await Visit.find({
        status: 'completed',
        'billing.status': 'pending',
        'consultation': { $ne: null }
      });

      for (const visit of visits) {
        const messageString = `Invoice overdue: Pending payment of dues for ${visit.patientName} (Token: ${visit.token || visit.id}).`;
        const exists = await Notification.findOne({
          type: 'billing',
          message: messageString
        });

        if (!exists) {
          const list = await Notification.find({});
          const nextId = 'NOTI' + String(list.length + 1).padStart(3, '0');

          await Notification.create({
            id: nextId,
            title: '💰 Invoice Overdue',
            message: messageString,
            type: 'billing',
            timestamp: new Date(),
            targetRoles: ['admin', 'receptionist'],
            targetUserId: visit.patientId,
            readBy: []
          });
        }
      }
    } catch (err) {
      console.error('⚠️ Overdue invoices check failed:', err.message);
    }

    return await Notification.find({}).sort({ timestamp: -1 });
  }

  async createNotification(notiData) {
    const list = await Notification.find({});
    const nextId = 'NOTI' + String(list.length + 1).padStart(3, '0');
    
    return await Notification.create({
      id: nextId,
      timestamp: new Date(),
      readBy: [],
      ...notiData
    });
  }

  async markNotificationsAsRead(userId) {
    await Notification.updateMany(
      { readBy: { $ne: userId } },
      { $push: { readBy: userId } }
    );
    return await this.getNotifications();
  }

  async markNotificationIdAsRead(id, userId) {
    await Notification.updateOne(
      { id, readBy: { $ne: userId } },
      { $push: { readBy: userId } }
    );
    return await Notification.findOne({ id });
  }
}

export default new NotificationService();
