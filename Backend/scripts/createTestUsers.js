require('dotenv').config();
const { getPool, sql } = require('../config/database');
const bcrypt = require('bcryptjs');

const testUsers = [
  {
    email: 'test.candidate@example.com',
    password: 'password123',
    role: 'candidate',
    firstName: 'Test',
    lastName: 'Candidate',
    phone: '03001234567',
    skills: 'JavaScript, Python, React',
    experienceYears: 2
  },
  {
    email: 'test.company@example.com',
    password: 'password123',
    role: 'company',
    companyName: 'Test Company Inc',
    phone: '03009876543',
    industry: 'Technology',
    location: 'Lahore, Pakistan',
    website: 'https://testcompany.com',
    description: 'A test company for development'
  },
  {
    email: 'admin@example.com',
    password: 'password123',
    role: 'admin',
    username: 'admin_test'
  }
];

(async () => {
  try {
    const pool = await getPool();

    console.log('Creating test users...\n');

    // Create candidate
    const candidateUser = testUsers[0];
    console.log('1. Creating test candidate...');
    
    const candidateHashedPassword = await bcrypt.hash(candidateUser.password, 10);
    const candidateUserResult = await pool.request()
      .input('email', sql.NVarChar, candidateUser.email)
      .input('password', sql.NVarChar, candidateHashedPassword)
      .input('role', sql.NVarChar, 'candidate')
      .query(`
        IF NOT EXISTS (SELECT 1 FROM Users WHERE email = @email)
        BEGIN
          INSERT INTO Users (email, password, role, isActive, isVerified)
          OUTPUT INSERTED.*
          VALUES (@email, @password, @role, 1, 1)
        END
        ELSE
        BEGIN
          SELECT * FROM Users WHERE email = @email
        END
      `);

    const candidateUserRecord = candidateUserResult.recordset[0];
    if (candidateUserRecord) {
      const candidateResult = await pool.request()
        .input('userId', sql.Int, candidateUserRecord.id)
        .input('fullName', sql.NVarChar, `${candidateUser.firstName} ${candidateUser.lastName}`)
        .input('phone', sql.NVarChar, candidateUser.phone)
        .input('skills', sql.Text, candidateUser.skills)
        .input('experienceYears', sql.Int, candidateUser.experienceYears)
        .query(`
          IF NOT EXISTS (SELECT 1 FROM Candidates WHERE userId = @userId)
          BEGIN
            INSERT INTO Candidates (userId, FullName, PhoneNumber, Skills, ExperienceYears)
            OUTPUT INSERTED.*
            VALUES (@userId, @fullName, @phone, @skills, @experienceYears)
          END
          ELSE
          BEGIN
            SELECT * FROM Candidates WHERE userId = @userId
          END
        `);

      console.log('✓ Test candidate created');
      console.log('  Email:', candidateUser.email);
      console.log('  Password:', candidateUser.password);
    }

    // Create company
    const companyUser = testUsers[1];
    console.log('\n2. Creating test company...');
    
    const companyHashedPassword = await bcrypt.hash(companyUser.password, 10);
    const companyUserResult = await pool.request()
      .input('email', sql.NVarChar, companyUser.email)
      .input('password', sql.NVarChar, companyHashedPassword)
      .input('role', sql.NVarChar, 'company')
      .query(`
        IF NOT EXISTS (SELECT 1 FROM Users WHERE email = @email)
        BEGIN
          INSERT INTO Users (email, password, role, isActive, isVerified)
          OUTPUT INSERTED.*
          VALUES (@email, @password, @role, 1, 1)
        END
        ELSE
        BEGIN
          SELECT * FROM Users WHERE email = @email
        END
      `);

    const companyUserRecord = companyUserResult.recordset[0];
    if (companyUserRecord) {
      const companyResult = await pool.request()
        .input('userId', sql.Int, companyUserRecord.id)
        .input('companyName', sql.NVarChar, companyUser.companyName)
        .input('phone', sql.NVarChar, companyUser.phone)
        .input('industry', sql.NVarChar, companyUser.industry)
        .input('location', sql.NVarChar, companyUser.location)
        .input('website', sql.NVarChar, companyUser.website)
        .input('description', sql.Text, companyUser.description)
        .query(`
          IF NOT EXISTS (SELECT 1 FROM Companies WHERE userId = @userId)
          BEGIN
            INSERT INTO Companies (userId, CompanyName, PhoneNumber, Industry, Location, Website, Description, IsVerified)
            OUTPUT INSERTED.*
            VALUES (@userId, @companyName, @phone, @industry, @location, @website, @description, 1)
          END
          ELSE
          BEGIN
            SELECT * FROM Companies WHERE userId = @userId
          END
        `);

      console.log('✓ Test company created');
      console.log('  Email:', companyUser.email);
      console.log('  Password:', companyUser.password);
    }

    // Create admin
    const adminUser = testUsers[2];
    console.log('\n3. Creating test admin...');
    
    const adminHashedPassword = await bcrypt.hash(adminUser.password, 10);
    const adminUserResult = await pool.request()
      .input('email', sql.NVarChar, adminUser.email)
      .input('password', sql.NVarChar, adminHashedPassword)
      .input('role', sql.NVarChar, 'admin')
      .query(`
        IF NOT EXISTS (SELECT 1 FROM Users WHERE email = @email)
        BEGIN
          INSERT INTO Users (email, password, role, isActive, isVerified)
          OUTPUT INSERTED.*
          VALUES (@email, @password, @role, 1, 1)
        END
        ELSE
        BEGIN
          SELECT * FROM Users WHERE email = @email
        END
      `);

    const adminUserRecord = adminUserResult.recordset[0];
    if (adminUserRecord) {
      const adminResult = await pool.request()
        .input('userId', sql.Int, adminUserRecord.id)
        .input('username', sql.NVarChar, adminUser.username)
        .query(`
          IF NOT EXISTS (SELECT 1 FROM Admins WHERE userId = @userId)
          BEGIN
            INSERT INTO Admins (userId, Username)
            OUTPUT INSERTED.*
            VALUES (@userId, @username)
          END
          ELSE
          BEGIN
            SELECT * FROM Admins WHERE userId = @userId
          END
        `);

      console.log('✓ Test admin created');
      console.log('  Email:', adminUser.email);
      console.log('  Password:', adminUser.password);
    }

    console.log('\n' + '='.repeat(50));
    console.log('✓ Test users created successfully!');
    console.log('='.repeat(50));
    console.log('\nYou can now login with these credentials:');
    console.log('\nCandidate:');
    console.log('  Email: test.candidate@example.com');
    console.log('  Password: password123');
    console.log('\nCompany:');
    console.log('  Email: test.company@example.com');
    console.log('  Password: password123');
    console.log('\nAdmin:');
    console.log('  Email: admin@example.com');
    console.log('  Password: password123');
    console.log('\n' + '='.repeat(50));

    process.exit(0);
  } catch (err) {
    console.error('Error creating test users:', err);
    process.exit(1);
  }
})();
