const { NotificationDoc, nextSequence, toPlain } = require('./mongoCollections');

class Notification {
  static async create(notificationData) {
    const notification = await NotificationDoc.create({
      NotificationID: await nextSequence('Notifications.NotificationID'),
      userId: Number(notificationData.userId),
      Title: notificationData.title || 'Notification',
      Message: notificationData.message,
      Type: notificationData.type || 'info',
      Link: notificationData.link || null,
      IsRead: false
    });

    return toPlain(notification);
  }

  static async findById(notificationId) {
    const doc = await NotificationDoc.findOne({ NotificationID: Number(notificationId) }).lean();
    return toPlain(doc);
  }

  static async findByUserId(userId, limit = 50) {
    const docs = await NotificationDoc.find({ userId: Number(userId) })
      .sort({ CreatedAt: -1 })
      .limit(Number(limit) || 50)
      .lean();
    return docs.map(toPlain);
  }

  static async markAsRead(notificationId) {
    const doc = await NotificationDoc.findOneAndUpdate(
      { NotificationID: Number(notificationId) },
      { $set: { IsRead: true } },
      { new: true }
    ).lean();
    return toPlain(doc);
  }

  static async markAllAsRead(userId) {
    await NotificationDoc.updateMany({ userId: Number(userId), IsRead: false }, { $set: { IsRead: true } });
    return true;
  }

  static async getUnreadCount(userId) {
    return NotificationDoc.countDocuments({ userId: Number(userId), IsRead: false });
  }

  static async delete(notificationId) {
    await NotificationDoc.deleteOne({ NotificationID: Number(notificationId) });
    return true;
  }

  static async deleteAll(userId) {
    await NotificationDoc.deleteMany({ userId: Number(userId) });
    return true;
  }
}

module.exports = Notification;