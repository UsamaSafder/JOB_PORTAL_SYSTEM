const { getPool, sql } = require('../config/database');
const bcrypt = require('bcryptjs');

class Company {
  static async create(companyData) {
    try {
      const pool = await getPool();
      
      // First create user
      const hashedPassword = await bcrypt.hash(companyData.password, 10);
      
      const userResult = await pool.request()
        .input('email', sql.NVarChar, companyData.email)
        .input('password', sql.NVarChar, hashedPassword)
        .input('role', sql.NVarChar, 'company')
        .query(`
          INSERT INTO Users (email, password, role, isActive)
          OUTPUT INSERTED.*
          VALUES (@email, @password, @role, 1)
        `);
      
      const user = userResult.recordset[0];
      
      // Then create company profile
      const companyResult = await pool.request()
        .input('userId', sql.Int, user.id)
        .input('companyName', sql.NVarChar, companyData.companyName)
        .input('phone', sql.NVarChar, companyData.phone)
        .input('industry', sql.NVarChar, companyData.industry)
        .input('location', sql.NVarChar, companyData.location || null)
        .input('website', sql.NVarChar, companyData.website || null)
        .input('description', sql.NVarChar(sql.MAX), companyData.description || null)
        .query(`
          INSERT INTO Companies (userId, CompanyName, PhoneNumber, Industry, Location, Website, Description)
          OUTPUT INSERTED.*
          VALUES (@userId, @companyName, @phone, @industry, @location, @website, @description)
        `);
      
      const company = companyResult.recordset[0];
      
      return {
        userId: user.id,
        CompanyID: company.CompanyID,
        Email: user.email,
        CompanyName: company.CompanyName,
        PhoneNumber: company.PhoneNumber,
        Industry: company.Industry,
        Location: company.Location,
        Website: company.Website,
        IsVerified: company.IsVerified,
        IsActive: user.isActive
      };
    } catch (err) {
      throw err;
    }
  }

  static async findById(companyId) {
    try {
      const pool = await getPool();
      const result = await pool.request()
        .input('companyId', sql.Int, companyId)
        .query(`
          SELECT c.*, u.email, u.isActive, u.isVerified AS UserIsVerified
          FROM Companies c
          INNER JOIN Users u ON c.userId = u.id
          WHERE c.CompanyID = @companyId
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
          SELECT c.*, u.email, u.isActive, u.isVerified AS UserIsVerified
          FROM Companies c
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
          SELECT c.CompanyID, c.userId, c.CompanyName, c.PhoneNumber, c.Industry, c.Location, c.Website, c.Description, c.Logo, c.IsVerified, c.CreatedAt, c.UpdatedAt,
                 u.id, u.email, u.password as PasswordHash, u.isActive as IsActive, u.isVerified as UserIsVerified
          FROM Companies c
          INNER JOIN Users u ON c.userId = u.id
          WHERE u.email = @email
        `);
      
      return result.recordset[0];
    } catch (err) {
      throw err;
    }
  }

  static async update(companyId, companyData) {
    try {
      const pool = await getPool();
      const request = pool.request();
      let updateFields = [];
      
      if (companyData.companyName) {
        updateFields.push('CompanyName = @companyName');
        request.input('companyName', sql.NVarChar, companyData.companyName);
      }
      
      if (companyData.phone) {
        updateFields.push('PhoneNumber = @phone');
        request.input('phone', sql.NVarChar, companyData.phone);
      }
      
      if (companyData.industry) {
        updateFields.push('Industry = @industry');
        request.input('industry', sql.NVarChar, companyData.industry);
      }
      
      if (companyData.location !== undefined) {
        updateFields.push('Location = @location');
        request.input('location', sql.NVarChar, companyData.location);
      }
      
      if (companyData.website !== undefined) {
        updateFields.push('Website = @website');
        request.input('website', sql.NVarChar, companyData.website);
      }
      
      if (companyData.description !== undefined) {
        updateFields.push('Description = @description');
        request.input('description', sql.NVarChar(sql.MAX), companyData.description);
      }
      
      if (companyData.logo !== undefined) {
        updateFields.push('Logo = @logo');
        request.input('logo', sql.NVarChar, companyData.logo);
      }

      if (companyData.isVerified !== undefined) {
        updateFields.push('IsVerified = @isVerified');
        request.input('isVerified', sql.Bit, companyData.isVerified ? 1 : 0);
      }
      
      updateFields.push('UpdatedAt = GETDATE()');
      
      request.input('companyId', sql.Int, companyId);
      const query = `UPDATE Companies SET ${updateFields.join(', ')} OUTPUT INSERTED.* WHERE CompanyID = @companyId`;
      
      const result = await request.query(query);
      return result.recordset[0];
    } catch (err) {
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
        SELECT c.*, u.email, u.isActive, c.IsVerified,
               (SELECT COUNT(*) FROM Jobs WHERE CompanyID = c.CompanyID AND IsActive = 1) as jobsPosted
        FROM Companies c
        INNER JOIN Users u ON c.userId = u.id
        WHERE 1=1
      `;
      const request = pool.request();

      if (filters.industry) {
        query += ` AND c.Industry = @industry`;
        request.input('industry', sql.NVarChar, filters.industry);
      }

      if (filters.isVerified !== undefined) {
        query += ` AND c.IsVerified = @isVerified`;
        request.input('isVerified', sql.Bit, filters.isVerified);
      }

      query += ` ORDER BY c.CreatedAt DESC`;
      
      const result = await request.query(query);
      return result.recordset;
    } catch (err) {
      throw err;
    }
  }
}

module.exports = Company;