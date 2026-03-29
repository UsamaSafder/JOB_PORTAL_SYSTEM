const { getPool, sql } = require('../config/database');
const bcrypt = require('bcryptjs');

class Candidate {
  static async create(candidateData) {
    try {
      const pool = await getPool();
      
      // First create user
      const hashedPassword = await bcrypt.hash(candidateData.password, 10);
      
      const userResult = await pool.request()
        .input('email', sql.NVarChar, candidateData.email)
        .input('password', sql.NVarChar, hashedPassword)
        .input('role', sql.NVarChar, 'candidate')
        .query(`
          INSERT INTO Users (email, password, role, isActive)
          OUTPUT INSERTED.*
          VALUES (@email, @password, @role, 1)
        `);
      
      const user = userResult.recordset[0];
      
      // Then create candidate profile
      const candidateResult = await pool.request()
        .input('userId', sql.Int, user.id)
        .input('fullName', sql.NVarChar, candidateData.fullName)
        .input('phone', sql.NVarChar, candidateData.phone)
        .input('skills', sql.NVarChar(sql.MAX), candidateData.skills || '')
        .input('experienceYears', sql.Int, candidateData.experienceYears || 0)
        .input('resumeLink', sql.NVarChar, candidateData.resumeLink || null)
        .input('location', sql.NVarChar, candidateData.location || null)
        .input('education', sql.NVarChar, candidateData.education || null)
        .input('bio', sql.NVarChar(sql.MAX), candidateData.bio || null)
        .input('linkedinUrl', sql.NVarChar, candidateData.linkedinUrl || null)
        .input('portfolioUrl', sql.NVarChar, candidateData.portfolioUrl || null)
        .query(`
          INSERT INTO Candidates (userId, FullName, PhoneNumber, Skills, ExperienceYears, ResumeLink, Location, Education, Bio, LinkedinUrl, PortfolioUrl)
          OUTPUT INSERTED.*
          VALUES (@userId, @fullName, @phone, @skills, @experienceYears, @resumeLink, @location, @education, @bio, @linkedinUrl, @portfolioUrl)
        `);
      
      const candidate = candidateResult.recordset[0];
      
      return {
        userId: user.id,
        CandidateID: candidate.CandidateID,
        Email: user.email,
        FullName: candidate.FullName,
        PhoneNumber: candidate.PhoneNumber,
        Skills: candidate.Skills,
        ExperienceYears: candidate.ExperienceYears,
        ResumeLink: candidate.ResumeLink,
        ProfilePicture: candidate.ProfilePicture,
        IsActive: user.isActive
      };
    } catch (err) {
      throw err;
    }
  }

  static async findById(candidateId) {
    try {
      const pool = await getPool();
      const result = await pool.request()
        .input('candidateId', sql.Int, candidateId)
        .query(`
          SELECT c.*, u.email, u.isActive, u.isVerified
          FROM Candidates c
          INNER JOIN Users u ON c.userId = u.id
          WHERE c.CandidateID = @candidateId
        `);
      
      return result.recordset[0];
    } catch (err) {
      throw err;
    }
  }

  static async findByUserId(userId) {
    try {
      const pool = await getPool();
      const result = await pool.request()
        .input('userId', sql.Int, userId)
        .query(`
          SELECT c.*, u.email, u.isActive, u.isVerified
          FROM Candidates c
          INNER JOIN Users u ON c.userId = u.id
          WHERE c.userId = @userId
        `);
      
      return result.recordset[0];
    } catch (err) {
      throw err;
    }
  }

  static async findByEmail(email) {
    try {
      const pool = await getPool();
      const result = await pool.request()
        .input('email', sql.NVarChar, email)
        .query(`
          SELECT c.CandidateID, c.userId, c.FullName, c.PhoneNumber, c.Skills, c.ExperienceYears, c.ResumeLink, c.ProfilePicture, c.CreatedAt, c.UpdatedAt,
                 u.id, u.email, u.password as PasswordHash, u.isActive as IsActive
          FROM Candidates c
          INNER JOIN Users u ON c.userId = u.id
          WHERE u.email = @email
        `);
      
      return result.recordset[0];
    } catch (err) {
      throw err;
    }
  }

  static async update(candidateId, candidateData) {
    try {
      const pool = await getPool();
      const request = pool.request();
      let updateFields = [];
      let hasUpdates = false;
      
      // Handle FullName
      if (candidateData.fullName !== undefined && candidateData.fullName !== null && typeof candidateData.fullName === 'string') {
        const fname = candidateData.fullName.trim();
        if (fname.length > 0) {
          updateFields.push('FullName = @fullName');
          request.input('fullName', sql.NVarChar(500), fname);
          hasUpdates = true;
        }
      }
      
      // Handle PhoneNumber
      if (candidateData.phone !== undefined && candidateData.phone !== null && typeof candidateData.phone === 'string') {
        const phone = candidateData.phone.trim();
        if (phone.length > 0) {
          updateFields.push('PhoneNumber = @phone');
          request.input('phone', sql.NVarChar(20), phone);
          hasUpdates = true;
        }
      }
      
      // Handle Skills
      if (candidateData.skills !== undefined && candidateData.skills !== null) {
        const skillsStr = String(candidateData.skills).trim();
        updateFields.push('Skills = @skills');
        request.input('skills', sql.NVarChar(sql.MAX), skillsStr.length > 0 ? skillsStr : '');
        hasUpdates = true;
      }
      
      // Handle ExperienceYears
      if (candidateData.experienceYears !== undefined && candidateData.experienceYears !== null) {
        const expNum = parseInt(String(candidateData.experienceYears), 10);
        if (!isNaN(expNum) && expNum >= 0 && expNum <= 100) {
          updateFields.push('ExperienceYears = @experienceYears');
          request.input('experienceYears', sql.Int, expNum);
          hasUpdates = true;
        }
      }
      
      // Handle ResumeLink
      if (candidateData.resumeLink !== undefined) {
        if (candidateData.resumeLink === null) {
          // Explicitly delete resume
          updateFields.push('ResumeLink = NULL');
          hasUpdates = true;
        } else if (candidateData.resumeLink !== null) {
          const resumeLink = String(candidateData.resumeLink).trim();
          updateFields.push('ResumeLink = @resumeLink');
          request.input('resumeLink', sql.NVarChar(500), resumeLink.length > 0 ? resumeLink : null);
          hasUpdates = true;
        }
      }

      if (candidateData.profilePicture !== undefined) {
        if (candidateData.profilePicture === null) {
          updateFields.push('ProfilePicture = NULL');
          hasUpdates = true;
        } else {
          const profilePicture = String(candidateData.profilePicture).trim();
          updateFields.push('ProfilePicture = @profilePicture');
          request.input('profilePicture', sql.NVarChar(500), profilePicture.length > 0 ? profilePicture : null);
          hasUpdates = true;
        }
      }

      // Handle location
      if (candidateData.location !== undefined) {
        const location = candidateData.location === null ? null : String(candidateData.location).trim();
        updateFields.push('Location = @location');
        request.input('location', sql.NVarChar(255), location && location.length > 0 ? location : null);
        hasUpdates = true;
      }

      // Handle education
      if (candidateData.education !== undefined) {
        const education = candidateData.education === null ? null : String(candidateData.education).trim();
        updateFields.push('Education = @education');
        request.input('education', sql.NVarChar(255), education && education.length > 0 ? education : null);
        hasUpdates = true;
      }

      // Handle bio
      if (candidateData.bio !== undefined) {
        const bio = candidateData.bio === null ? null : String(candidateData.bio).trim();
        updateFields.push('Bio = @bio');
        request.input('bio', sql.NVarChar(sql.MAX), bio && bio.length > 0 ? bio : null);
        hasUpdates = true;
      }

      // Handle linkedin url
      if (candidateData.linkedinUrl !== undefined) {
        const linkedinUrl = candidateData.linkedinUrl === null ? null : String(candidateData.linkedinUrl).trim();
        updateFields.push('LinkedinUrl = @linkedinUrl');
        request.input('linkedinUrl', sql.NVarChar(500), linkedinUrl && linkedinUrl.length > 0 ? linkedinUrl : null);
        hasUpdates = true;
      }

      // Handle portfolio url
      if (candidateData.portfolioUrl !== undefined) {
        const portfolioUrl = candidateData.portfolioUrl === null ? null : String(candidateData.portfolioUrl).trim();
        updateFields.push('PortfolioUrl = @portfolioUrl');
        request.input('portfolioUrl', sql.NVarChar(500), portfolioUrl && portfolioUrl.length > 0 ? portfolioUrl : null);
        hasUpdates = true;
      }
      
      // Always update UpdatedAt
      updateFields.push('UpdatedAt = GETDATE()');
      
      // If no actual fields changed, just return current data
      if (!hasUpdates) {
        console.log('[Candidate.update] No fields to update, returning current candidate');
        const result = await pool.request()
          .input('candidateId', sql.Int, candidateId)
          .query('SELECT * FROM Candidates WHERE CandidateID = @candidateId');
        
        if (!result.recordset || result.recordset.length === 0) {
          throw new Error(`Candidate with ID ${candidateId} not found`);
        }
        return result.recordset[0];
      }
      
      // Build and execute query
      request.input('candidateId', sql.Int, candidateId);
      const query = `UPDATE Candidates SET ${updateFields.join(', ')} OUTPUT INSERTED.* WHERE CandidateID = @candidateId`;
      
      console.log('[Candidate.update] Executing query for ID:', candidateId);
      console.log('[Candidate.update] Update fields:', updateFields);
      console.log('[Candidate.update] Query:', query);
      
      const result = await request.query(query);
      
      if (!result.recordset || result.recordset.length === 0) {
        throw new Error(`Candidate with ID ${candidateId} not found`);
      }
      
      console.log('[Candidate.update] Update successful');
      return result.recordset[0];
    } catch (err) {
      console.error('');
      console.error('=== CANDIDATE.UPDATE ERROR ===');
      console.error('Error name:', err?.name);
      console.error('Error message:', err?.message);
      console.error('Error code:', err?.code);
      console.error('Error number:', err?.number);
      console.error('Error state:', err?.state);
      console.error('Error class:', err?.class);
      console.error('Error procName:', err?.procName);
      console.error('Error severity:', err?.severity);
      console.error('Full error:', JSON.stringify(err, null, 2));
      console.error('Stack:', err?.stack);
      console.error('==============================');
      console.error('');
      throw err;
    }
  }

  static async comparePassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  static async findAll(filters = {}) {
    try {
      const pool = await getPool();
      let query = `
        SELECT c.*, u.email, u.isActive
        FROM Candidates c
        INNER JOIN Users u ON c.userId = u.id
        WHERE 1=1
      `;
      const request = pool.request();

      if (filters.skills) {
        query += ` AND c.Skills LIKE @skills`;
        request.input('skills', sql.NVarChar, `%${filters.skills}%`);
      }

      if (filters.experienceYears !== undefined) {
        query += ` AND c.ExperienceYears >= @experienceYears`;
        request.input('experienceYears', sql.Int, filters.experienceYears);
      }

      query += ` ORDER BY c.CreatedAt DESC`;
      
      const result = await request.query(query);
      return result.recordset;
    } catch (err) {
      throw err;
    }
  }

  static async getCandidateStats(candidateId) {
    try {
      const pool = await getPool();
      const result = await pool.request()
        .input('candidateId', sql.Int, candidateId)
        .query(`
          SELECT
            (SELECT COUNT(*) FROM Applications WHERE CandidateID = @candidateId) as TotalApplications,
            (SELECT COUNT(*) FROM Applications WHERE CandidateID = @candidateId AND Status = 'Pending') as PendingApplications,
            (SELECT COUNT(*) FROM Interviews i INNER JOIN Applications a ON i.ApplicationID = a.ApplicationID WHERE a.CandidateID = @candidateId AND i.Status = 'Scheduled') as InterviewsScheduled,
            (SELECT COUNT(*) FROM Applications WHERE CandidateID = @candidateId AND Status = 'Rejected') as RejectedApplications
        `);

      return result.recordset[0];
    } catch (err) {
      throw err;
    }
  }
}

module.exports = Candidate;