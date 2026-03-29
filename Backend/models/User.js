const { getPool, sql } = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
  static async create(userData) {
    try {
      const pool = await getPool();
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      
      const result = await pool.request()
        .input('email', sql.NVarChar, userData.email)
        .input('password', sql.NVarChar, hashedPassword)
        .input('role', sql.NVarChar, userData.role)
        .input('isActive', sql.Bit, userData.isActive !== undefined ? userData.isActive : true)
        .input('isVerified', sql.Bit, userData.isVerified || false)
        .query(`
          INSERT INTO Users (email, password, role, isActive, isVerified)
          OUTPUT INSERTED.*
          VALUES (@email, @password, @role, @isActive, @isVerified)
        `);
      
      return result.recordset[0];
    } catch (err) {
      throw err;
    }
  }

  static async findById(id) {
    try {
      const pool = await getPool();
      const result = await pool.request()
        .input('id', sql.Int, id)
        .query('SELECT * FROM Users WHERE id = @id');
      
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
        .query('SELECT * FROM Users WHERE email = @email');
      
      return result.recordset[0];
    } catch (err) {
      throw err;
    }
  }

  static async findAll(filters = {}) {
    try {
      const pool = await getPool();
      let query = 'SELECT * FROM Users WHERE 1=1';
      const request = pool.request();

      if (filters.role) {
        query += ' AND role = @role';
        request.input('role', sql.NVarChar, filters.role);
      }

      if (filters.isActive !== undefined) {
        query += ' AND isActive = @isActive';
        request.input('isActive', sql.Bit, filters.isActive);
      }

      query += ' ORDER BY createdAt DESC';
      const result = await request.query(query);
      
      return result.recordset;
    } catch (err) {
      throw err;
    }
  }

  static async update(id, userData) {
    try {
      const pool = await getPool();
      const request = pool.request();
      let updateFields = [];
      
      if (userData.email) {
        updateFields.push('email = @email');
        request.input('email', sql.NVarChar, userData.email);
      }
      
      if (userData.password) {
        const hashedPassword = await bcrypt.hash(userData.password, 10);
        updateFields.push('password = @password');
        request.input('password', sql.NVarChar, hashedPassword);
      }
      
      if (userData.isActive !== undefined) {
        updateFields.push('isActive = @isActive');
        request.input('isActive', sql.Bit, userData.isActive);
      }
      
      if (userData.isVerified !== undefined) {
        updateFields.push('isVerified = @isVerified');
        request.input('isVerified', sql.Bit, userData.isVerified);
      }
      
      updateFields.push('updatedAt = GETDATE()');
      
      request.input('id', sql.Int, id);
      const query = `UPDATE Users SET ${updateFields.join(', ')} OUTPUT INSERTED.* WHERE id = @id`;
      
      const result = await request.query(query);
      return result.recordset[0];
    } catch (err) {
      throw err;
    }
  }

  static async delete(id) {
    try {
      const pool = await getPool();
      await pool.request()
        .input('id', sql.Int, id)
        .query('DELETE FROM Users WHERE id = @id');
      
      return true;
    } catch (err) {
      throw err;
    }
  }

  static async comparePassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  static async getUserWithProfile(id) {
    try {
      const pool = await getPool();
      const result = await pool.request()
        .input('id', sql.Int, id)
        .query(`
          SELECT u.*, 
            c.companyName, c.logo, c.contactPerson, c.phone as companyPhone,
            can.firstName, can.lastName, can.phone as candidatePhone, can.resumePath
          FROM Users u
          LEFT JOIN Companies c ON u.id = c.userId
          LEFT JOIN Candidates can ON u.id = can.userId
          WHERE u.id = @id
        `);
      
      return result.recordset[0];
    } catch (err) {
      throw err;
    }
  }
}

module.exports = User;