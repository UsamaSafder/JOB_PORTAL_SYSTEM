const { getPool, sql } = require('../config/database');

async function testData() {
  try {
    const pool = await getPool();

    console.log('\n=== Testing Company and Candidate Queries ===\n');

    // Test company query
    const companyResult = await pool.request()
      .input('email', sql.NVarChar, 'test.company@example.com')
      .query(`SELECT c.CompanyID, c.userId FROM Companies c INNER JOIN Users u ON c.userId = u.id WHERE u.email = @email`);
    
    console.log('Company query result:', companyResult.recordset);

    // Test candidate query
    const candidateResult = await pool.request()
      .input('email', sql.NVarChar, 'test.candidate@example.com')
      .query(`SELECT c.CandidateID, c.userId FROM Candidates c INNER JOIN Users u ON c.userId = u.id WHERE u.email = @email`);
    
    console.log('Candidate query result:', candidateResult.recordset);

    const testCompany = companyResult.recordset[0];
    const testCandidate = candidateResult.recordset[0];

    if (!testCompany || !testCandidate) {
      console.log('\n!!! Test users not found. Creating them first...');
      
      // Create users
      const bcrypt = require('bcryptjs');
      
      // Create company user
      const hashPassword = await bcrypt.hash('password123', 10);
      const userResult = await pool.request()
        .input('email', sql.NVarChar, 'test.company@example.com')
        .input('password', sql.NVarChar, hashPassword)
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

      const companyUserRecord = userResult.recordset[0];
      console.log('Company user created/found:', companyUserRecord);

      if (companyUserRecord) {
        const companyInsert = await pool.request()
          .input('userId', sql.Int, companyUserRecord.id)
          .input('companyName', sql.NVarChar, 'Test Company Inc')
          .input('phone', sql.NVarChar, '03009876543')
          .input('industry', sql.NVarChar, 'Technology')
          .input('location', sql.NVarChar, 'Lahore, Pakistan')
          .input('website', sql.NVarChar, 'https://testcompany.com')
          .input('description', sql.Text, 'A test company')
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

        console.log('Company created:', companyInsert.recordset[0]);
      }

      // Create candidate user
      const candidateUserResult = await pool.request()
        .input('email', sql.NVarChar, 'test.candidate@example.com')
        .input('password', sql.NVarChar, hashPassword)
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
      console.log('Candidate user created/found:', candidateUserRecord);

      if (candidateUserRecord) {
        const candidateInsert = await pool.request()
          .input('userId', sql.Int, candidateUserRecord.id)
          .input('fullName', sql.NVarChar, 'Test Candidate')
          .input('phone', sql.NVarChar, '03001234567')
          .input('skills', sql.Text, 'JavaScript, Python, React')
          .input('experienceYears', sql.Int, 2)
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

        console.log('Candidate created:', candidateInsert.recordset[0]);
      }

      // Now try queries again
      const companyResult2 = await pool.request()
        .input('email', sql.NVarChar, 'test.company@example.com')
        .query(`SELECT c.CompanyID, c.userId FROM Companies c INNER JOIN Users u ON c.userId = u.id WHERE u.email = @email`);
      
      console.log('\nCompany query result (after creation):', companyResult2.recordset);
    }

    console.log('\n=== Now creating test jobs and applications ===\n');

    // Get company and candidate again
    const company = (await pool.request()
      .input('email', sql.NVarChar, 'test.company@example.com')
      .query(`SELECT c.CompanyID, c.userId FROM Companies c INNER JOIN Users u ON c.userId = u.id WHERE u.email = @email`)).recordset[0];

    const candidate = (await pool.request()
      .input('email', sql.NVarChar, 'test.candidate@example.com')
      .query(`SELECT c.CandidateID, c.userId FROM Candidates c INNER JOIN Users u ON c.userId = u.id WHERE u.email = @email`)).recordset[0];

    console.log('Company:', company);
    console.log('Candidate:', candidate);

    if (company && candidate) {
      // Create a test job
      const jobResult = await pool.request()
        .input('companyId', sql.Int, company.CompanyID)
        .input('title', sql.NVarChar, 'Test Job')
        .input('description', sql.Text, 'Test Description')
        .input('location', sql.NVarChar, 'Test Location')
        .input('salaryRange', sql.NVarChar, '100000 - 150000')
        .input('requirements', sql.Text, 'Test Requirements')
        .input('experienceRequired', sql.Int, 1)
        .query(`
          INSERT INTO Jobs (CompanyID, Title, Description, Location, SalaryRange, Requirements, ExperienceRequired, Status)
          OUTPUT INSERTED.JobID
          VALUES (@companyId, @title, @description, @location, @salaryRange, @requirements, @experienceRequired, 'Open')
        `);

      const jobId = jobResult.recordset[0].JobID;
      console.log('Job created with ID:', jobId);

      // Create test application
      const appResult = await pool.request()
        .input('jobId', sql.Int, jobId)
        .input('candidateId', sql.Int, candidate.CandidateID)
        .input('status', sql.NVarChar, 'Pending')
        .query(`
          INSERT INTO Applications (JobID, CandidateID, Status)
          OUTPUT INSERTED.ApplicationID
          VALUES (@jobId, @candidateId, @status)
        `);

      const appId = appResult.recordset[0].ApplicationID;
      console.log('Application created with ID:', appId);

      // Now test the GET endpoint query
      console.log('\n=== Testing the GET endpoint query ===\n');
      const appsResult = await pool.request()
        .input('companyId', sql.Int, company.CompanyID)
        .query(`
          SELECT a.*, j.Title as JobTitle, c.FullName as CandidateName
          FROM Applications a
          INNER JOIN Jobs j ON a.JobID = j.JobID
          INNER JOIN Candidates c ON a.CandidateID = c.CandidateID
          WHERE j.CompanyID = @companyId
        `);

      console.log('Applications found:', appsResult.recordset);
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

testData();
