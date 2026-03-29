const { getPool, sql } = require('../config/database');

class Application {
  static async create(applicationData) {
    try {
      const pool = await getPool();
      
      const result = await pool.request()
        .input('jobId', sql.Int, applicationData.jobId)
        .input('candidateId', sql.Int, applicationData.candidateId)
        .input('coverLetter', sql.NVarChar(sql.MAX), applicationData.coverLetter || null)
        .input('resumePath', sql.NVarChar, applicationData.resumePath || null)
        .query(`
          INSERT INTO Applications (JobID, CandidateID, CoverLetter, AppliedAt, Status)
          OUTPUT INSERTED.*
          VALUES (@jobId, @candidateId, @coverLetter, GETDATE(), 'Pending')
        `);
      
      return result.recordset[0];
    } catch (err) {
      throw err;
    }
  }

  static async findById(applicationId) {
    try {
      const pool = await getPool();
      const result = await pool.request()
        .input('applicationId', sql.Int, applicationId)
        .query(`
          SELECT 
            a.*,
            j.Title as jobTitle, 
            j.Location as jobLocation,
            j.SalaryRange as salaryRange,
            j.CompanyID,
            c.FullName as candidateName,
            c.PhoneNumber as candidatePhone,
            c.Skills as candidateSkills,
            c.ExperienceYears as experienceYears,
            c.ResumeLink as resumeLink,
            comp.CompanyName,
            comp.CompanyID as companyId,
            u.email as candidateEmail
          FROM Applications a
          INNER JOIN Jobs j ON a.JobID = j.JobID
          INNER JOIN Candidates c ON a.CandidateID = c.CandidateID
          INNER JOIN Companies comp ON j.CompanyID = comp.CompanyID
          INNER JOIN Users u ON c.userId = u.id
          WHERE a.ApplicationID = @applicationId
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
          a.*,
          j.Title as jobTitle,
          j.Location as jobLocation,
          j.SalaryRange as salaryRange,
          j.CompanyID as companyId,
          c.FullName as candidateName,
          c.PhoneNumber as candidatePhone,
          c.Skills as candidateSkills,
          c.ExperienceYears as experienceYears,
          c.ResumeLink as resumeLink,
          comp.CompanyName,
          u.email as candidateEmail,
          latestInterview.ScheduledDate as interviewScheduledDate,
          latestInterview.Location as interviewLocation,
          latestInterview.Mode as interviewMode,
          latestInterview.Status as interviewStatus
        FROM Applications a
        INNER JOIN Jobs j ON a.JobID = j.JobID
        INNER JOIN Candidates c ON a.CandidateID = c.CandidateID
        INNER JOIN Companies comp ON j.CompanyID = comp.CompanyID
        INNER JOIN Users u ON c.userId = u.id
        OUTER APPLY (
          SELECT TOP 1 i.ScheduledDate, i.Location, i.Mode, i.Status
          FROM Interviews i
          WHERE i.ApplicationID = a.ApplicationID
          ORDER BY i.ScheduledDate DESC, i.InterviewID DESC
        ) latestInterview
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

      if (filters.jobId) {
        query += ` AND a.JobID = @jobId`;
        request.input('jobId', sql.Int, filters.jobId);
      }

      if (filters.status) {
        query += ` AND a.Status = @status`;
        request.input('status', sql.NVarChar, filters.status);
      }

      query += ` ORDER BY a.AppliedAt DESC`;
      
      console.log('Application.findAll executing query with filters:', filters);
      
      const result = await request.query(query);
      console.log('Application.findAll result count:', result.recordset.length);
      return result.recordset;
    } catch (err) {
      console.error('Application.findAll error:', err.message);
      console.error('Application.findAll stack:', err.stack);
      throw err;
    }
  }

  static async update(applicationId, applicationData) {
    try {
      const pool = await getPool();
      const request = pool.request();
      let updateFields = [];
      
      if (applicationData.status) {
        updateFields.push('Status = @status');
        request.input('status', sql.NVarChar, applicationData.status);
      }
      
      if (applicationData.coverLetter !== undefined) {
        updateFields.push('CoverLetter = @coverLetter');
        request.input('coverLetter', sql.NVarChar(sql.MAX), applicationData.coverLetter);
      }

      if (applicationData.notes !== undefined) {
        updateFields.push('Notes = @notes');
        request.input('notes', sql.NVarChar(sql.MAX), applicationData.notes);
      }
      
      updateFields.push('UpdatedAt = GETDATE()');
      
      request.input('applicationId', sql.Int, applicationId);
      const query = `UPDATE Applications SET ${updateFields.join(', ')} OUTPUT INSERTED.* WHERE ApplicationID = @applicationId`;
      
      const result = await request.query(query);
      return result.recordset[0];
    } catch (err) {
      throw err;
    }
  }

  static async delete(applicationId) {
    try {
      const pool = await getPool();
      await pool.request()
        .input('applicationId', sql.Int, applicationId)
        .query('DELETE FROM Applications WHERE ApplicationID = @applicationId');
      
      return true;
    } catch (err) {
      throw err;
    }
  }

  static async checkDuplicate(jobId, candidateId) {
    try {
      const pool = await getPool();
      const result = await pool.request()
        .input('jobId', sql.Int, jobId)
        .input('candidateId', sql.Int, candidateId)
        .query(`
          SELECT ApplicationID as id 
          FROM Applications 
          WHERE JobID = @jobId AND CandidateID = @candidateId
        `);
      
      return result.recordset[0];
    } catch (err) {
      throw err;
    }
  }
}

module.exports = Application;