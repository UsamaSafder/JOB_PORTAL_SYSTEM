const Candidate = require('../models/Candidate');
const Company = require('../models/Company');
const { convertToCamelCase } = require('../utils/helper');
const jwt = require('jsonwebtoken');
const { getPool, sql } = require('../config/database');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// Generate JWT token
// For candidates: id should be CandidateID
// For companies: id should be CompanyID  
// For admin: id should be AdminID
const generateToken = (id, email, role) => {
  return jwt.sign(
    { id: id, email, role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
};

// Register new user
exports.register = async (req, res) => {
  try {
    const { email, password, role, firstName, lastName, phone, skills, experienceYears, companyName, industry, website, location, description } = req.body;

    console.log('Registration request received:', { email, role });

    // Check directly against the Users table first — catches orphaned rows too
    const pool = await getPool();
    const userCheck = await pool.request()
      .input('email', sql.NVarChar, email)
      .query('SELECT id FROM Users WHERE email = @email');
    if (userCheck.recordset.length > 0) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Create user based on role
    let user;
    if (role === 'candidate') {
      if (!firstName || !phone) {
        return res.status(400).json({ error: 'Full name and phone are required for candidates' });
      }

      const fullName = `${firstName} ${lastName || ''}`.trim();

      const candidateData = {
        fullName: fullName,
        email: email,
        password: password,
        phone: phone,
        skills: skills || '',
        experienceYears: experienceYears || 0,
        resumeLink: null
      };

      user = await Candidate.create(candidateData);
      console.log('Candidate created:', { id: user.CandidateID, email: user.Email });

      // Generate token with userId (from Users table)
      const token = generateToken(user.userId, user.Email, 'candidate');

      res.status(201).json({
        message: 'Registration successful',
        token,
        user: {
          id: user.CandidateID,
          candidateId: user.CandidateID,
          email: user.Email,
          role: 'candidate',
          fullName: user.FullName,
          phone: user.PhoneNumber,
          skills: user.Skills,
          experienceYears: user.ExperienceYears,
          profilePicture: user.ProfilePicture || null
        }
      });

    } else if (role === 'company') {
      if (!companyName || !phone || !industry) {
        return res.status(400).json({ error: 'Company name, phone, and industry are required for companies' });
      }

      const companyData = {
        companyName: companyName,
        email: email,
        password: password,
        phone: phone,
        industry: industry,
        location: location || null,
        website: website || null,
        description: description || null
      };

      user = await Company.create(companyData);
      console.log('Company created:', { id: user.CompanyID, email: user.Email });

      // Generate token with userId (from Users table)
      const token = generateToken(user.userId, user.Email, 'company');

      res.status(201).json({
        message: 'Registration successful',
        token,
        user: {
          id: user.CompanyID,
          companyId: user.CompanyID,
          email: user.Email,
          role: 'company',
          companyName: user.CompanyName,
          phone: user.PhoneNumber,
          industry: user.Industry,
          location: user.Location,
          website: user.Website,
          logo: user.Logo || null
        }
      });
    } else {
      return res.status(400).json({ error: 'Invalid role' });
    }

  } catch (error) {
    console.error('Registration error:', error);
    // SQL Server duplicate key violation — email already exists
    if (error.number === 2627 || error.number === 2601 || (error.originalError && (error.originalError.code === 2627 || error.originalError.code === 2601))) {
      return res.status(400).json({ error: 'Email already registered' });
    }
    res.status(500).json({ 
      error: 'Registration failed', 
      message: error.message 
    });
  }
};

// Login user

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log('Login attempt for email:', email); // ADD THIS

    // Try to find user in candidate, company, then admin tables
    let user = await Candidate.findByEmail(email);
    let role = 'candidate';

    if (!user) {
      user = await Company.findByEmail(email);
      role = 'company';
    }

    if (!user) {
      // Try admin by email or username fallback
      const Admin = require('../models/Admin');
      user = await Admin.findByEmail(email);
      if (user) {
        role = 'admin';
      } else {
        // try username lookup (some admin logins may send username)
        user = await Admin.findByUsername(email);
        if (user) role = 'admin';
      }
    }

    console.log('User found:', user ? 'Yes' : 'No', 'Role:', role); // ADD THIS
    console.log('User data:', JSON.stringify(user, null, 2)); // ADD THIS

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // ... rest of the code
    // Verify password
    const Model = role === 'candidate' ? Candidate : (role === 'company' ? Company : require('../models/Admin'));
    const isPasswordValid = await Model.comparePassword(password, user.PasswordHash);

    console.log('Password verification result for', email, ':', isPasswordValid);

    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Normalize active flag (some queries alias to IsActive)
    const userIsActive = (user.IsActive !== undefined) ? user.IsActive : (user.isActive !== undefined ? user.isActive : true);

    console.log('User active flag for', email, ':', userIsActive);

    if (userIsActive === 0 || userIsActive === false) {
      return res.status(403).json({ error: 'Account is deactivated' });
    }

    // Generate token and response depending on role
    let tokenId;
    let responseUser;

    if (role === 'candidate') {
      tokenId = user.userId;  // Use userId (from Users table) for token, NOT CandidateID
      console.log('Candidate token ID being set:', tokenId, 'Type:', typeof tokenId);
      responseUser = {
        id: user.CandidateID,  // Send CandidateID to frontend for display
        candidateId: user.CandidateID,
        email: user.Email,
        role: 'candidate',
        fullName: user.FullName,
        phone: user.PhoneNumber,
        skills: user.Skills,
        experienceYears: user.ExperienceYears,
        resumeLink: user.ResumeLink,
        profilePicture: user.ProfilePicture || null
      };
    } else if (role === 'company') {
      tokenId = user.userId;  // Use userId (from Users table) for token, NOT CompanyID
      console.log('Company token ID being set:', tokenId, 'Type:', typeof tokenId);
      responseUser = {
        id: user.CompanyID,  // Send CompanyID to frontend for display
        companyId: user.CompanyID,
        email: user.Email,
        role: 'company',
        companyName: user.CompanyName,
        phone: user.PhoneNumber,
        industry: user.Industry,
        location: user.Location,
        website: user.Website,
        isVerified: user.IsVerified,
        logo: user.Logo || null
      };
    } else {
      // admin
      tokenId = user.userId;  // Use userId for token consistency
      responseUser = {
        id: tokenId,
        email: user.email || user.Email,
        role: 'admin',
        username: user.Username || user.username
      };
    }

    const token = generateToken(tokenId, user.Email || user.email, role);

    console.log('Login response for role:', role, 'User:', responseUser);

    res.json({
      message: 'Login successful',
      token,
      user: responseUser
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed', message: error.message });
  }
};

// Get user profile
exports.getProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const role = req.user.role;

    let user;
    if (role === 'candidate') {
      user = await Candidate.findById(userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json({
        user: {
          id: user.CandidateID,
          email: user.Email,
          role: 'candidate',
          fullName: user.FullName,
          phone: user.PhoneNumber,
          skills: user.Skills,
          experienceYears: user.ExperienceYears,
          resumeLink: user.ResumeLink
        }
      });
    } else {
      user = await Company.findById(userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json({
        user: {
          id: user.CompanyID,
          email: user.Email,
          role: 'company',
          companyName: user.CompanyName,
          phone: user.PhoneNumber,
          industry: user.Industry,
          location: user.Location,
          website: user.Website,
          isVerified: user.IsVerified
        }
      });
    }

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to get profile', message: error.message });
  }
};

// Change password
exports.changePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const role = req.user.role;
    const { currentPassword, newPassword } = req.body;

    // Get user
    let user;
    const Model = role === 'candidate' ? Candidate : Company;
    
    user = await Model.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify current password
    const isPasswordValid = await Model.comparePassword(currentPassword, user.PasswordHash);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Update password (you'll need to add an update method to models)
    res.json({ message: 'Password changed successfully' });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Failed to change password', message: error.message });
  }
};

// Logout
exports.logout = async (req, res) => {
  try {
    res.json({ message: 'Logout successful' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Logout failed', message: error.message });
  }
};

// Initialize test users (for development only)
exports.initializeTestUsers = async (req, res) => {
  try {
    const { getPool, sql } = require('../config/database');
    const bcrypt = require('bcryptjs');

    const pool = await getPool();

    console.log('Initializing test users...');

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

    const createdUsers = [];

    // Create candidate
    const candidateUser = testUsers[0];
    const candidateHashedPassword = await bcrypt.hash(candidateUser.password, 10);
    
    try {
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
          .input('skills', sql.NVarChar(sql.MAX), candidateUser.skills)
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

        createdUsers.push({
          email: candidateUser.email,
          password: candidateUser.password,
          role: 'candidate'
        });
      }
    } catch (err) {
      console.error('Error creating candidate test user:', err.message);
    }

    // Create company
    const companyUser = testUsers[1];
    const companyHashedPassword = await bcrypt.hash(companyUser.password, 10);
    
    try {
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
          .input('description', sql.NVarChar(sql.MAX), companyUser.description)
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

        createdUsers.push({
          email: companyUser.email,
          password: companyUser.password,
          role: 'company'
        });
      }
    } catch (err) {
      console.error('Error creating company test user:', err.message);
    }

    // Create admin
    const adminUser = testUsers[2];
    const adminHashedPassword = await bcrypt.hash(adminUser.password, 10);
    
    try {
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

        createdUsers.push({
          email: adminUser.email,
          password: adminUser.password,
          role: 'admin'
        });
      }
    } catch (err) {
      console.error('Error creating admin test user:', err.message);
    }

    res.json({
      success: true,
      message: 'Test users initialized',
      users: createdUsers
    });

  } catch (error) {
    console.error('Test user initialization error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to initialize test users',
      message: error.message
    });
  }
};

// Initialize test data (jobs and applications)
exports.initializeTestData = async (req, res) => {
  try {
    const { getPool, sql } = require('../config/database');
    const pool = await getPool();

    console.log('Initializing test data (jobs and applications)...');

    // First, get test company and candidate IDs
    console.log('Fetching test company...');
    const companyResult = await pool.request()
      .input('email', sql.NVarChar, 'test.company@example.com')
      .query('SELECT c.CompanyID, c.userId FROM Companies c INNER JOIN Users u ON c.userId = u.id WHERE u.email = @email');
    
    console.log('Fetching test candidate...');
    const candidateResult = await pool.request()
      .input('email', sql.NVarChar, 'test.candidate@example.com')
      .query('SELECT c.CandidateID, c.userId FROM Candidates c INNER JOIN Users u ON c.userId = u.id WHERE u.email = @email');
    
    const testCompany = companyResult.recordset[0];
    const testCandidate = candidateResult.recordset[0];

    console.log('Test company:', testCompany);
    console.log('Test candidate:', testCandidate);

    if (!testCompany) {
      return res.status(400).json({ 
        error: 'Test company not found. Please run init-test-users first.',
        debug: { companyQuery: 'test.company@example.com' }
      });
    }

    if (!testCandidate) {
      return res.status(400).json({ 
        error: 'Test candidate not found. Please run init-test-users first.',
        debug: { candidateQuery: 'test.candidate@example.com' }
      });
    }

    const createdJobs = [];
    const createdApplications = [];

    // Create test jobs
    const testJobs = [
      {
        title: 'Senior React Developer',
        description: 'We are looking for an experienced React developer to join our team.',
        location: 'Lahore, Pakistan',
        salaryRange: '100000 - 150000',
        requirements: 'React, TypeScript, Node.js',
        employmentType: 'Full-time'
      },
      {
        title: 'Full Stack Developer',
        description: 'Full stack developer needed for web application development.',
        location: 'Islamabad, Pakistan',
        salaryRange: '80000 - 120000',
        requirements: 'Angular, Node.js, SQL Server',
        employmentType: 'Full-time'
      },
      {
        title: 'Backend Developer',
        description: 'Backend developer to work with Node.js and databases.',
        location: 'Karachi, Pakistan',
        salaryRange: '70000 - 100000',
        requirements: 'Node.js, Express, SQL Server',
        employmentType: 'Full-time'
      }
    ];

    for (const job of testJobs) {
      try {
        console.log(`Creating job: ${job.title} for CompanyID: ${testCompany.CompanyID}`);
        
        const jobResult = await pool.request()
          .input('companyId', sql.Int, testCompany.CompanyID)
          .input('title', sql.NVarChar, job.title)
          .input('description', sql.NVarChar(sql.MAX), job.description)
          .input('location', sql.NVarChar, job.location)
          .input('salaryRange', sql.NVarChar, job.salaryRange)
          .input('requirements', sql.NVarChar(sql.MAX), job.requirements)
          .input('employmentType', sql.NVarChar, job.employmentType)
          .input('deadline', sql.Date, new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)) // 30 days from now
          .query(`
            INSERT INTO Jobs (CompanyID, Title, Description, Location, SalaryRange, Requirements, EmploymentType, Deadline, IsActive, PostedAt)
            OUTPUT INSERTED.JobID
            VALUES (@companyId, @title, @description, @location, @salaryRange, @requirements, @employmentType, @deadline, 1, GETDATE())
          `);

        const jobId = jobResult.recordset[0]?.JobID;
        console.log(`Job created with ID: ${jobId}`);
        
        if (jobId) {
          createdJobs.push({ jobId, title: job.title });

          // Create applications for this job
          const statuses = ['Pending', 'Reviewed', 'Accepted', 'Rejected'];
          for (let i = 0; i < statuses.length; i++) {
            try {
              console.log(`Creating application for JobID: ${jobId}, CandidateID: ${testCandidate.CandidateID}, Status: ${statuses[i]}`);
              
              const appResult = await pool.request()
                .input('jobId', sql.Int, jobId)
                .input('candidateId', sql.Int, testCandidate.CandidateID)
                .input('status', sql.NVarChar, statuses[i])
                .query(`
                  INSERT INTO Applications (JobID, CandidateID, Status, AppliedAt)
                  OUTPUT INSERTED.ApplicationID
                  VALUES (@jobId, @candidateId, @status, GETDATE())
                `);

              const appId = appResult.recordset[0]?.ApplicationID;
              console.log(`Application created with ID: ${appId}`);
              
              createdApplications.push({ 
                applicationId: appId,
                jobTitle: job.title, 
                status: statuses[i] 
              });
            } catch (err) {
              console.warn('Error creating application:', err.message);
            }
          }
        }
      } catch (err) {
        console.warn('Error creating test job:', err.message);
      }
    }

    res.json({
      success: true,
      message: 'Test data initialized',
      jobsCreated: createdJobs.length,
      applicationsCreated: createdApplications.length,
      companyInfo: {
        companyId: testCompany.CompanyID,
        userId: testCompany.userId
      },
      candidateInfo: {
        candidateId: testCandidate.CandidateID,
        userId: testCandidate.userId
      },
      jobs: createdJobs,
      applications: createdApplications
    });

  } catch (error) {
    console.error('Test data initialization error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to initialize test data',
      message: error.message
    });
  }
};