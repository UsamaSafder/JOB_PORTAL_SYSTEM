const { getPool, sql } = require('../config/database');

class Job {
  static async create(jobData) {
    try {
      const pool = await getPool();
      
      const result = await pool.request()
        .input('companyId', sql.Int, jobData.companyId)
        .input('title', sql.NVarChar, jobData.title)
        .input('description', sql.NVarChar(sql.MAX), jobData.description || null)
        .input('requirements', sql.NVarChar(sql.MAX), jobData.requirements || null)
        .input('location', sql.NVarChar, jobData.location || null)
        .input('salaryRange', sql.NVarChar, jobData.salary || jobData.salaryRange || null)
        .input('employmentType', sql.NVarChar, jobData.jobType || jobData.employmentType || null)
        .input('deadline', sql.Date, jobData.deadline || null)
        .query(`
          INSERT INTO Jobs (CompanyID, Title, Description, Requirements, Location, SalaryRange, EmploymentType, Deadline, IsActive)
          OUTPUT INSERTED.*
          VALUES (@companyId, @title, @description, @requirements, @location, @salaryRange, @employmentType, @deadline, 1)
        `);
      
      return result.recordset[0];
    } catch (err) {
      throw err;
    }
  }

  static async findById(jobId) {
    try {
      const pool = await getPool();
      const result = await pool.request()
        .input('jobId', sql.Int, jobId)
        .query(`
          SELECT j.*, c.CompanyName, c.Location as CompanyLocation, c.Website, c.Logo
          FROM Jobs j
          INNER JOIN Companies c ON j.CompanyID = c.CompanyID
          WHERE j.JobID = @jobId
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
        SELECT j.*, j.CreatedAt as PostedAt, c.CompanyName, c.Location as CompanyLocation, c.Logo
        FROM Jobs j
        INNER JOIN Companies c ON j.CompanyID = c.CompanyID
        WHERE 1=1
      `;
      const request = pool.request();

      if (filters.companyId) {
        query += ` AND j.CompanyID = @companyId`;
        request.input('companyId', sql.Int, filters.companyId);
      }

      if (filters.status === 'active' || filters.isActive !== false) {
        query += ` AND j.IsActive = 1`;
      }

      if (filters.jobType || filters.employmentType) {
        query += ` AND j.EmploymentType = @employmentType`;
        request.input('employmentType', sql.NVarChar, filters.jobType || filters.employmentType);
      }

      if (filters.location) {
        query += ` AND j.Location LIKE @location`;
        request.input('location', sql.NVarChar, `%${filters.location}%`);
      }

      if (filters.search) {
        query += ` AND (j.Title LIKE @search OR j.Description LIKE @search)`;
        request.input('search', sql.NVarChar, `%${filters.search}%`);
      }

      if (filters.excludeExpired) {
        query += ` AND (j.Deadline IS NULL OR CAST(j.Deadline AS DATE) >= CAST(GETDATE() AS DATE))`;
      }

      query += ` ORDER BY j.CreatedAt DESC`;

      if (filters.limit) {
        query += ` OFFSET ${filters.offset || 0} ROWS FETCH NEXT ${filters.limit} ROWS ONLY`;
      }
      
      const result = await request.query(query);
      return result.recordset;
    } catch (err) {
      throw err;
    }
  }

  static async update(jobId, jobData) {
    try {
      const pool = await getPool();
      const request = pool.request();
      let updateFields = [];
      
      if (jobData.title) {
        updateFields.push('Title = @title');
        request.input('title', sql.NVarChar, jobData.title);
      }
      
      if (jobData.description !== undefined) {
        updateFields.push('Description = @description');
        request.input('description', sql.NVarChar(sql.MAX), jobData.description);
      }
      
      if (jobData.requirements !== undefined) {
        updateFields.push('Requirements = @requirements');
        request.input('requirements', sql.NVarChar(sql.MAX), jobData.requirements);
      }
      
      if (jobData.location !== undefined) {
        updateFields.push('Location = @location');
        request.input('location', sql.NVarChar, jobData.location);
      }
      
      if (jobData.salary || jobData.salaryRange) {
        updateFields.push('SalaryRange = @salaryRange');
        request.input('salaryRange', sql.NVarChar, jobData.salary || jobData.salaryRange);
      }
      
      if (jobData.jobType || jobData.employmentType) {
        updateFields.push('EmploymentType = @employmentType');
        request.input('employmentType', sql.NVarChar, jobData.jobType || jobData.employmentType);
      }

      if (jobData.deadline !== undefined) {
        updateFields.push('Deadline = @deadline');
        request.input('deadline', sql.Date, jobData.deadline || null);
      }
      
      if (jobData.status !== undefined) {
        updateFields.push('IsActive = @isActive');
        request.input('isActive', sql.Bit, jobData.status === 'active' ? 1 : 0);
      }
      
      if (jobData.isActive !== undefined) {
        let normalizedIsActive;

        if (typeof jobData.isActive === 'string') {
          const normalizedValue = jobData.isActive.trim().toLowerCase();
          normalizedIsActive = normalizedValue === 'active' || normalizedValue === 'true' || normalizedValue === '1';
        } else {
          normalizedIsActive = Boolean(jobData.isActive);
        }

        updateFields.push('IsActive = @isActive');
        request.input('isActive', sql.Bit, normalizedIsActive ? 1 : 0);
      }
      
      request.input('jobId', sql.Int, jobId);
      const query = `UPDATE Jobs SET ${updateFields.join(', ')} OUTPUT INSERTED.* WHERE JobID = @jobId`;
      
      const result = await request.query(query);
      return result.recordset[0];
    } catch (err) {
      throw err;
    }
  }

  static async delete(jobId) {
    try {
      const pool = await getPool();
      await pool.request()
        .input('jobId', sql.Int, jobId)
        .query('DELETE FROM Jobs WHERE JobID = @jobId');
      
      return true;
    } catch (err) {
      throw err;
    }
  }

  static async getRecommendedJobs(candidateId, limit = 10) {
    try {
      const pool = await getPool();
      
      // Get candidate skills
      const candidateResult = await pool.request()
        .input('candidateId', sql.Int, candidateId)
        .query('SELECT Skills FROM Candidates WHERE CandidateID = @candidateId');
      
      const candidate = candidateResult.recordset[0];
      const skills = candidate?.Skills || '';
      
      // Find jobs matching skills
      const result = await pool.request()
        .input('skills', sql.NVarChar, `%${skills}%`)
        .input('limit', sql.Int, limit)
        .query(`
          SELECT TOP (@limit) j.*, j.CreatedAt as PostedAt, c.CompanyName, c.Logo
          FROM Jobs j
          INNER JOIN Companies c ON j.CompanyID = c.CompanyID
          WHERE j.IsActive = 1 
          AND (j.Requirements LIKE @skills OR j.Description LIKE @skills)
          ORDER BY j.CreatedAt DESC
        `);
      
      return result.recordset;
    } catch (err) {
      throw err;
    }
  }
}

module.exports = Job;