const { getPool, sql } = require('../config/database');
const bcrypt = require('bcryptjs');

class Admin {
  static async create(adminData) {
    try {
      const pool = await getPool();
      
      // First create user
      const hashedPassword = await bcrypt.hash(adminData.password, 10);
      
      const userResult = await pool.request()
        .input('email', sql.NVarChar, adminData.email || adminData.username + '@admin.com')
        .input('password', sql.NVarChar, hashedPassword)
        .input('role', sql.NVarChar, 'admin')
        .query(`
          INSERT INTO Users (email, password, role, isActive, isVerified)
          OUTPUT INSERTED.*
          VALUES (@email, @password, @role, 1, 1)
        `);
      
      const user = userResult.recordset[0];
      
      // Then create admin profile
      const adminResult = await pool.request()
        .input('userId', sql.Int, user.id)
        .input('username', sql.NVarChar, adminData.username)
        .input('phone', sql.NVarChar, adminData.phone || null)
        .input('department', sql.NVarChar, adminData.department || null)
        .query(`
          INSERT INTO Admins (userId, Username, PhoneNumber, Department)
          OUTPUT INSERTED.*
          VALUES (@userId, @username, @phone, @department)
        `);
      
      const admin = adminResult.recordset[0];
      
      return {
        AdminID: admin.AdminID,
        Username: admin.Username,
        Email: user.email
      };
    } catch (err) {
      throw err;
    }
  }

  static async findById(adminId) {
    try {
      const pool = await getPool();
      const result = await pool.request()
        .input('adminId', sql.Int, adminId)
        .query(`
          SELECT a.*, u.email, u.isActive
          FROM Admins a
          INNER JOIN Users u ON a.userId = u.id
          WHERE a.AdminID = @adminId
        `);
      
      return result.recordset[0];
    } catch (err) {
      throw err;
    }
  }

  static async findByUsername(username) {
    try {
      const pool = await getPool();
      const result = await pool.request()
        .input('username', sql.NVarChar, username)
        .query(`
          SELECT a.*, u.email, u.password as PasswordHash, u.isActive
          FROM Admins a
          INNER JOIN Users u ON a.userId = u.id
          WHERE a.Username = @username
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
          SELECT a.*, u.email, u.password as PasswordHash, u.isActive
          FROM Admins a
          INNER JOIN Users u ON a.userId = u.id
          WHERE u.email = @email
        `);
      
      return result.recordset[0];
    } catch (err) {
      throw err;
    }
  }

  static async comparePassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }
}

module.exports = Admin;