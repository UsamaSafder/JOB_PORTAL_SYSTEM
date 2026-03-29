const { getPool, sql } = require('../config/database');
const bcrypt = require('bcryptjs');

async function createTestData() {
  try {
    const pool = await getPool();

    console.log('\n=== Creating Test Data ===\n');

    // First create test users if they don't exist
    console.log('Creating test users...');
    
    // Create company user
    const hashPassword = await bcrypt.hash('password123', 10);
    const companyUserResult = await pool.request()
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

    const companyUser = companyUserResult.recordset[0];
    console.log('Company user:', companyUser.email);

    // Create company profile
    if (companyUser) {
      const companyResult = await pool.request()
        .input('userId', sql.Int, companyUser.id)
        .input('companyName', sql.NVarChar, 'Test Company Inc')
        .input('phone', sql.NVarChar, '03009876543')
        .input('industry', sql.NVarChar, 'Technology')
        .input('location', sql.NVarChar, 'Lahore, Pakistan')
        .input('website', sql.NVarChar, 'https://testcompany.com')
        .input('description', sql.Text, 'A test company')
        .query(`
          IF NOT EXISTS (SELECT 1 FROM Companies WHERE userId = @userId)
          BEGIN
            INSERT INTO Companies (userId, CompanyName, PhoneNumber, Industry, Location, Website, Description)
            OUTPUT INSERTED.*
            VALUES (@userId, @companyName, @phone, @industry, @location, @website, @description)
          END
          ELSE
          BEGIN
            SELECT * FROM Companies WHERE userId = @userId
          END
        `);

      const company = companyResult.recordset[0];
      console.log('Company created with ID:', company.CompanyID);

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

      const candidateUser = candidateUserResult.recordset[0];
      console.log('Candidate user:', candidateUser.email);

      // Create candidate profile
      if (candidateUser) {
        const candidateResult = await pool.request()
          .input('userId', sql.Int, candidateUser.id)
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

        const candidate = candidateResult.recordset[0];
        console.log('Candidate created with ID:', candidate.CandidateID);

        // Create additional test candidates for different applications
        console.log('\nCreating additional test candidates...');
        const additionalCandidates = [];
        const candidateNames = [
          'John Developer',
          'Sarah Coder',
          'Ahmed Engineer'
        ];

        for (let i = 0; i < candidateNames.length; i++) {
          const candidateEmail = `test.candidate${i+2}@example.com`;
          const candidateUserResult2 = await pool.request()
            .input('email', sql.NVarChar, candidateEmail)
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

          const candidateUser2 = candidateUserResult2.recordset[0];
          const candidateResult2 = await pool.request()
            .input('userId', sql.Int, candidateUser2.id)
            .input('fullName', sql.NVarChar, candidateNames[i])
            .input('phone', sql.NVarChar, '030012345' + (i+2))
            .input('skills', sql.Text, 'JavaScript, Python, React')
            .input('experienceYears', sql.Int, i+1)
            .query(`
              INSERT INTO Candidates (userId, FullName, PhoneNumber, Skills, ExperienceYears)
              OUTPUT INSERTED.*
              VALUES (@userId, @fullName, @phone, @skills, @experienceYears)
            `);

          const candidate2 = candidateResult2.recordset[0];
          additionalCandidates.push(candidate2);
          console.log(`  - ${candidateNames[i]} (ID: ${candidate2.CandidateID})`);
        }

        // Now create test jobs
        console.log('\nCreating test jobs...');
        
        const testJobs = [
          {
            title: 'Senior React Developer',
            description: 'We are looking for an experienced React developer to join our team.',
            location: 'Lahore, Pakistan',
            salary: '100000 - 150000',
            requirements: 'React, TypeScript, Node.js',
            jobType: 'Full-time'
          },
          {
            title: 'Full Stack Developer',
            description: 'Full stack developer needed for web application development.',
            location: 'Islamabad, Pakistan',
            salary: '80000 - 120000',
            requirements: 'Angular, Node.js, SQL Server',
            jobType: 'Full-time'
          },
          {
            title: 'Backend Developer',
            description: 'Backend developer to work with Node.js and databases.',
            location: 'Karachi, Pakistan',
            salary: '70000 - 100000',
            requirements: 'Node.js, Express, SQL Server',
            jobType: 'Full-time'
          }
        ];

        const deadline = new Date();
        deadline.setDate(deadline.getDate() + 30);

        const allCandidates = [candidate, ...additionalCandidates];
        let appCount = 0;
        const statuses = ['Pending', 'Reviewed', 'Accepted', 'Rejected'];

        for (const job of testJobs) {
          const jobResult = await pool.request()
            .input('companyId', sql.Int, company.CompanyID)
            .input('title', sql.NVarChar, job.title)
            .input('description', sql.Text, job.description)
            .input('location', sql.NVarChar, job.location)
            .input('salary', sql.NVarChar, job.salary)
            .input('requirements', sql.Text, job.requirements)
            .input('jobType', sql.NVarChar, job.jobType)
            .query(`
              INSERT INTO Jobs (CompanyID, Title, Description, Location, SalaryRange, Requirements, EmploymentType, IsActive)
              OUTPUT INSERTED.JobID
              VALUES (@companyId, @title, @description, @location, @salary, @requirements, @jobType, 1)
            `);

          const jobId = jobResult.recordset[0].JobID;
          console.log(`  - ${job.title} (ID: ${jobId})`);

          // Create applications from different candidates with different statuses
          for (let i = 0; i < Math.min(allCandidates.length, statuses.length); i++) {
            await pool.request()
              .input('jobId', sql.Int, jobId)
              .input('candidateId', sql.Int, allCandidates[i].CandidateID)
              .input('status', sql.NVarChar, statuses[i])
              .query(`
                INSERT INTO Applications (JobID, CandidateID, Status, AppliedAt)
                VALUES (@jobId, @candidateId, @status, GETDATE())
              `);
            appCount++;
          }
          console.log(`    Created ${Math.min(allCandidates.length, statuses.length)} applications`);
        }

        console.log(`\n✓ Test data created successfully!`);
        console.log(`  - Created ${testJobs.length} jobs`);
        console.log(`  - Created ${appCount} applications`);
        console.log('\nTest credentials:');
        console.log('  Company: test.company@example.com / password123');
        console.log('  Candidates: test.candidate@example.com / password123 (and additional ones)');
      }
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error creating test data:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

createTestData();
