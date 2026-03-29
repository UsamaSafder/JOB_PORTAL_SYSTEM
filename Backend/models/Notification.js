const { getPool, sql } = require('../config/database');

class Notification {
  static async create(notificationData) {
    try {
      const pool = await getPool();
      
      const result = await pool.request()
        .input('userId', sql.Int, notificationData.userId)
        .input('title', sql.NVarChar, notificationData.title || 'Notification')
        .input('message', sql.NVarChar(sql.MAX), notificationData.message)
        .input('type', sql.NVarChar, notificationData.type || 'info')
        .input('link', sql.NVarChar, notificationData.link || null)
        .query(`
          INSERT INTO Notifications (userId, Title, Message, Type, Link, IsRead)
          OUTPUT INSERTED.*
          VALUES (@userId, @title, @message, @type, @link, 0)
        `);
      
      return result.recordset[0];
    } catch (err) {
      throw err;
    }
  }

  static async findById(notificationId) {
    try {
      const pool = await getPool();
      const result = await pool.request()
        .input('notificationId', sql.Int, notificationId)
        .query('SELECT * FROM Notifications WHERE NotificationID = @notificationId');
      
      return result.recordset[0];
    } catch (err) {
      throw err;
    }
  }

  static async findByUserId(userId, limit = 50) {
    try {
      const pool = await getPool();
      const result = await pool.request()
        .input('userId', sql.Int, userId)
        .input('limit', sql.Int, limit)
        .query(`
          SELECT TOP (@limit) * 
          FROM Notifications 
          WHERE userId = @userId 
          ORDER BY CreatedAt DESC
        `);
      
      return result.recordset;
    } catch (err) {
      throw err;
    }
  }

  static async markAsRead(notificationId) {
    try {
      const pool = await getPool();
      const result = await pool.request()
        .input('notificationId', sql.Int, notificationId)
        .query(`
          UPDATE Notifications 
          SET IsRead = 1 
          OUTPUT INSERTED.*
          WHERE NotificationID = @notificationId
        `);
      
      return result.recordset[0];
    } catch (err) {
      throw err;
    }
  }

  static async markAllAsRead(userId) {
    try {
      const pool = await getPool();
      await pool.request()
        .input('userId', sql.Int, userId)
        .query('UPDATE Notifications SET IsRead = 1 WHERE userId = @userId AND IsRead = 0');
      
      return true;
    } catch (err) {
      throw err;
    }
  }

  static async getUnreadCount(userId) {
    try {
      const pool = await getPool();
      const result = await pool.request()
        .input('userId', sql.Int, userId)
        .query('SELECT COUNT(*) as unreadCount FROM Notifications WHERE userId = @userId AND IsRead = 0');
      
      return result.recordset[0].unreadCount;
    } catch (err) {
      throw err;
    }
  }

  static async delete(notificationId) {
    try {
      const pool = await getPool();
      await pool.request()
        .input('notificationId', sql.Int, notificationId)
        .query('DELETE FROM Notifications WHERE NotificationID = @notificationId');
      
      return true;
    } catch (err) {
      throw err;
    }
  }

  static async deleteAll(userId) {
    try {
      const pool = await getPool();
      await pool.request()
        .input('userId', sql.Int, userId)
        .query('DELETE FROM Notifications WHERE userId = @userId');
      
      return true;
    } catch (err) {
      throw err;
    }
  }
}

module.exports = Notification;