const Candidate = require('../models/Candidate');
const Company = require('../models/Company');
const User = require('../models/User');
const Job = require('../models/Job');
const Application = require('../models/Application');
const Admin = require('../models/Admin');
const { convertToCamelCase } = require('../utils/helper');
const jwt = require('jsonwebtoken');

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

    const existingUser = await User.findByEmail(email);
    if (existingUser) {
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
    if (String(error.message || '').toLowerCase().includes('duplicate')) {
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
    const { email, password, role: selectedRole } = req.body;

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

    if (selectedRole && selectedRole !== role) {
      return res.status(403).json({
        error: 'Selected account type does not match these credentials'
      });
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
      user = await Candidate.findByUserId(userId);
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
      user = await Company.findByUserId(userId);
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
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify current password
    const isPasswordValid = await User.comparePassword(currentPassword, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    await User.update(userId, { password: newPassword });
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

    const candidateUser = testUsers[0];
    try {
      let candidate = await Candidate.findByEmail(candidateUser.email);
      if (!candidate) {
        candidate = await Candidate.create({
          fullName: `${candidateUser.firstName} ${candidateUser.lastName}`,
          email: candidateUser.email,
          password: candidateUser.password,
          phone: candidateUser.phone,
          skills: candidateUser.skills,
          experienceYears: candidateUser.experienceYears
        });
      }
      createdUsers.push({ email: candidateUser.email, password: candidateUser.password, role: 'candidate' });
    } catch (err) {
      console.error('Error creating candidate test user:', err.message);
    }

    const companyUser = testUsers[1];
    try {
      let company = await Company.findByEmail(companyUser.email);
      if (!company) {
        company = await Company.create({
          companyName: companyUser.companyName,
          email: companyUser.email,
          password: companyUser.password,
          phone: companyUser.phone,
          industry: companyUser.industry,
          location: companyUser.location,
          website: companyUser.website,
          description: companyUser.description,
          isVerified: true
        });
      }
      await User.update(company.userId, { isVerified: true });
      await Company.update(company.CompanyID, { isVerified: true });
      createdUsers.push({ email: companyUser.email, password: companyUser.password, role: 'company' });
    } catch (err) {
      console.error('Error creating company test user:', err.message);
    }

    const adminUser = testUsers[2];
    try {
      let admin = await Admin.findByEmail(adminUser.email);
      if (!admin) {
        admin = await Admin.create({
          email: adminUser.email,
          password: adminUser.password,
          username: adminUser.username
        });
      }
      createdUsers.push({ email: adminUser.email, password: adminUser.password, role: 'admin' });
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
    console.log('Initializing test data (jobs and applications)...');

    const testCompany = await Company.findByEmail('test.company@example.com');
    const testCandidate = await Candidate.findByEmail('test.candidate@example.com');

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

        const createdJob = await Job.create({
          companyId: testCompany.CompanyID,
          title: job.title,
          description: job.description,
          location: job.location,
          salaryRange: job.salaryRange,
          requirements: job.requirements,
          employmentType: job.employmentType,
          deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        });

        const jobId = createdJob?.JobID;
        console.log(`Job created with ID: ${jobId}`);
        
        if (jobId) {
          createdJobs.push({ jobId, title: job.title });

          // Create applications for this job
          const statuses = ['Pending', 'Reviewed', 'Accepted', 'Rejected'];
          for (let i = 0; i < statuses.length; i++) {
            try {
              console.log(`Creating application for JobID: ${jobId}, CandidateID: ${testCandidate.CandidateID}, Status: ${statuses[i]}`);

              const app = await Application.create({
                jobId,
                candidateId: testCandidate.CandidateID,
                coverLetter: null
              });
              const updated = await Application.update(app.ApplicationID, { status: statuses[i] });
              const appId = updated?.ApplicationID || app.ApplicationID;
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