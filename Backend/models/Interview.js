const { getPool, sql } = require('../config/database');

class Interview {
  static async create(interviewData) {
    try {
      const pool = await getPool();
      
      const result = await pool.request()
        .input('applicationId', sql.Int, interviewData.applicationId)
        .input('scheduledDate', sql.DateTime, interviewData.interviewDate || interviewData.scheduledDate)
        .input('location', sql.NVarChar, interviewData.location || null)
        .input('mode', sql.NVarChar, interviewData.interviewType || interviewData.mode || 'Online')
        .input('interviewerName', sql.NVarChar, interviewData.interviewerName || null)
        .input('notes', sql.NVarChar(sql.MAX), interviewData.notes || null)
        .input('status', sql.NVarChar, 'scheduled')
        .query(`
          INSERT INTO Interviews (ApplicationID, ScheduledDate, Location, Mode, InterviewerName, Notes, Status)
          OUTPUT INSERTED.*
          VALUES (@applicationId, @scheduledDate, @location, @mode, @interviewerName, @notes, @status)
        `);
      
      return result.recordset[0];
    } catch (err) {
      console.error('Interview.create error:', err);
      throw err;
    }
  }

  static async findByApplicationId(applicationId) {
    try {
      const pool = await getPool();
      const result = await pool.request()
        .input('applicationId', sql.Int, applicationId)
        .query(`
          SELECT TOP 1 *
          FROM Interviews
          WHERE ApplicationID = @applicationId
          ORDER BY ScheduledDate DESC, InterviewID DESC
        `);

      return result.recordset[0];
    } catch (err) {
      throw err;
    }
  }

  static async findById(interviewId) {
    try {
      const pool = await getPool();
      const result = await pool.request()
        .input('interviewId', sql.Int, interviewId)
        .query(`
          SELECT 
            i.*,
            a.JobID,
            a.CandidateID,
            j.Title as JobTitle,
            c.FullName as CandidateName,
            c.PhoneNumber as CandidatePhone,
            comp.CompanyName,
            u.email as CandidateEmail
          FROM Interviews i
          INNER JOIN Applications a ON i.ApplicationID = a.ApplicationID
          INNER JOIN Jobs j ON a.JobID = j.JobID
          INNER JOIN Candidates c ON a.CandidateID = c.CandidateID
          INNER JOIN Companies comp ON j.CompanyID = comp.CompanyID
          INNER JOIN Users u ON c.userId = u.id
          WHERE i.InterviewID = @interviewId
        `);
      
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
          i.*,
          a.JobID,
          a.CandidateID,
          j.Title as JobTitle,
          c.FullName as CandidateName,
          c.PhoneNumber as CandidatePhone,
          comp.CompanyName,
          comp.CompanyID,
          u.email as CandidateEmail
        FROM Interviews i
        INNER JOIN Applications a ON i.ApplicationID = a.ApplicationID
        INNER JOIN Jobs j ON a.JobID = j.JobID
        INNER JOIN Candidates c ON a.CandidateID = c.CandidateID
        INNER JOIN Companies comp ON j.CompanyID = comp.CompanyID
        INNER JOIN Users u ON c.userId = u.id
        WHERE 1=1
      `;
      const request = pool.request();

      if (filters.candidateId) {
        query += ` AND a.CandidateID = @candidateId`;
        request.input('candidateId', sql.Int, filters.candidateId);
      }

      if (filters.companyId) {
        query += ` AND j.CompanyID = @companyId`;
        request.input('companyId', sql.Int, filters.companyId);
      }

      if (filters.status) {
        query += ` AND i.Status = @status`;
        request.input('status', sql.NVarChar, filters.status);
      }

      query += ` ORDER BY i.ScheduledDate ASC`;
      
      const result = await request.query(query);
      return result.recordset;
    } catch (err) {
      throw err;
    }
  }

  static async update(interviewId, interviewData) {
    try {
      const pool = await getPool();
      const request = pool.request();
      let updateFields = [];
      
      if (interviewData.scheduledDate || interviewData.interviewDate) {
        updateFields.push('ScheduledDate = @scheduledDate');
        request.input('scheduledDate', sql.DateTime, interviewData.scheduledDate || interviewData.interviewDate);
      }
      
      if (interviewData.location !== undefined) {
        updateFields.push('Location = @location');
        request.input('location', sql.NVarChar, interviewData.location);
      }
      
      if (interviewData.mode || interviewData.interviewType) {
        updateFields.push('Mode = @mode');
        request.input('mode', sql.NVarChar, interviewData.mode || interviewData.interviewType);
      }
      
      if (interviewData.interviewerName !== undefined) {
        updateFields.push('InterviewerName = @interviewerName');
        request.input('interviewerName', sql.NVarChar, interviewData.interviewerName);
      }
      
      if (interviewData.notes !== undefined) {
        updateFields.push('Notes = @notes');
        request.input('notes', sql.NVarChar(sql.MAX), interviewData.notes);
      }
      
      if (interviewData.status) {
        updateFields.push('Status = @status');
        request.input('status', sql.NVarChar, interviewData.status);
      }

      if (interviewData.rescheduleReason !== undefined) {
        updateFields.push('RescheduleReason = @rescheduleReason');
        request.input('rescheduleReason', sql.NVarChar(sql.MAX), interviewData.rescheduleReason);
      }
      
      request.input('interviewId', sql.Int, interviewId);
      const query = `UPDATE Interviews SET ${updateFields.join(', ')} OUTPUT INSERTED.* WHERE InterviewID = @interviewId`;
      
      const result = await request.query(query);
      return result.recordset[0];
    } catch (err) {
      throw err;
    }
  }

  static async delete(interviewId) {
    try {
      const pool = await getPool();
      await pool.request()
        .input('interviewId', sql.Int, interviewId)
        .query('DELETE FROM Interviews WHERE InterviewID = @interviewId');
      
      return true;
    } catch (err) {
      throw err;
    }
  }
}

module.exports = Interview;