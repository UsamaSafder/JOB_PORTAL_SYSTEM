require('dotenv').config();
const { getPool, sql } = require('../config/database');
const bcrypt = require('bcryptjs');

(async () => {
  try {
    const pool = await getPool();
    
    const email = 'arshadkashaf1@gmail.com';
    const password = '123456';
    const username = 'arshad_admin';
    
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create user
    const userResult = await pool.request()
      .input('email', sql.NVarChar, email)
      .input('password', sql.NVarChar, hashedPassword)
      .input('role', sql.NVarChar, 'admin')
      .query(`
        INSERT INTO Users (email, password, role, isActive, isVerified)
        OUTPUT INSERTED.*
        VALUES (@email, @password, @role, 1, 1)
      `);
    
    const user = userResult.recordset[0];
    console.log('✓ User created with ID:', user.id);
    
    // Create admin profile
    const adminResult = await pool.request()
      .input('userId', sql.Int, user.id)
      .input('username', sql.NVarChar, username)
      .query(`
        INSERT INTO Admins (userId, Username)
        OUTPUT INSERTED.*
        VALUES (@userId, @username)
      `);
    
    const admin = adminResult.recordset[0];
    
    console.log('\n✓ Admin created successfully!');
    console.log('\nUse these credentials to login:');
    console.log('Email:', email);
    console.log('Password:', password);
    console.log('\nLogin URL: http://localhost:5002/api/auth/login');
    console.log('\nBody:');
    console.log(JSON.stringify({
      email: email,
      password: password
    }, null, 2));
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
})();
