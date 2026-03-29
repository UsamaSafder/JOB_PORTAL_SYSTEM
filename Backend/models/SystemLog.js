const { getPool, sql } = require('../config/database');

class SystemLog {
  static async create(logData) {
    try {
      const pool = await getPool();
      
      const result = await pool.request()
        .input('userId', sql.Int, logData.userId || null)
        .input('action', sql.NVarChar, logData.action)
        .input('entity', sql.NVarChar, logData.entity || null)
        .input('entityId', sql.Int, logData.entityId || null)
        .input('details', sql.NVarChar(sql.MAX), logData.details || null)
        .input('ipAddress', sql.NVarChar, logData.ipAddress || null)
        .input('userAgent', sql.NVarChar, logData.userAgent || null)
        .query(`
          INSERT INTO SystemLogs (userId, Action, Entity, EntityId, Details, IpAddress, UserAgent)
          OUTPUT INSERTED.*
          VALUES (@userId, @action, @entity, @entityId, @details, @ipAddress, @userAgent)
        `);
      
      return result.recordset[0];
    } catch (err) {
      console.error('Error creating system log:', err);
      // Don't throw - logging should never break the application
      return null;
    }
  }

  static async findById(logId) {
    try {
      const pool = await getPool();
      const result = await pool.request()
        .input('logId', sql.Int, logId)
        .query('SELECT * FROM SystemLogs WHERE LogID = @logId');
      
      return result.recordset[0];
    } catch (err) {
      throw err;
    }
  }

  static async findAll(filters = {}) {
    try {
      const pool = await getPool();
      let query = `
        SELECT 
          sl.LogID,
          sl.UserId,
          sl.Action,
          sl.Entity,
          sl.EntityId,
          sl.Details,
          sl.IpAddress,
          sl.UserAgent,
          CONVERT(VARCHAR(30), sl.CreatedAt, 121) as Timestamp,
          u.Email,
          u.Role as UserType,
          ISNULL(c.FullName, co.CompanyName) as UserName
        FROM SystemLogs sl
        LEFT JOIN Users u ON sl.UserId = u.id
        LEFT JOIN Candidates c ON u.id = c.userId
        LEFT JOIN Companies co ON u.id = co.userId
        WHERE 1=1
      `;
      const request = pool.request();

      if (filters.userId) {
        query += ' AND sl.UserId = @userId';
        request.input('userId', sql.Int, filters.userId);
      }

      if (filters.action) {
        query += ' AND sl.Action LIKE @action';
        request.input('action', sql.NVarChar, '%' + filters.action + '%');
      }

      if (filters.entity) {
        query += ' AND sl.Entity = @entity';
        request.input('entity', sql.NVarChar, filters.entity);
      }

      if (filters.startDate) {
        query += ' AND sl.CreatedAt >= @startDate';
        request.input('startDate', sql.DateTime, filters.startDate);
      }

      if (filters.endDate) {
        query += ' AND sl.CreatedAt <= @endDate';
        request.input('endDate', sql.DateTime, filters.endDate);
      }

      query += ' ORDER BY sl.CreatedAt DESC';

      if (filters.limit) {
        query += ` OFFSET ${filters.offset || 0} ROWS FETCH NEXT ${filters.limit} ROWS ONLY`;
      }
      
      const result = await request.query(query);
      return result.recordset;
    } catch (err) {
      throw err;
    }
  }

  static async deleteOldLogs(daysOld = 90) {
    try {
      const pool = await getPool();
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);
      
      const result = await pool.request()
        .input('cutoffDate', sql.DateTime, cutoffDate)
        .query('DELETE FROM SystemLogs WHERE CreatedAt < @cutoffDate');
      
      return result.rowsAffected[0];
    } catch (err) {
      throw err;
    }
  }
}

module.exports = SystemLog;