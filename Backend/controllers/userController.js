const User = require('../models/User');
const Company = require('../models/Company');
const Candidate = require('../models/Candidate');
const SystemLog = require('../models/SystemLog');
const Admin = require('../models/Admin');
const { convertToCamelCase } = require('../utils/helper');
const { toPublicUploadPath } = require('../utils/filePath');
const { UserDoc, CompanyDoc, CandidateDoc, JobDoc, ApplicationDoc, InterviewDoc } = require('../models/mongoCollections');
const { extractTextFromResume, extractResumeProfileData } = require('../utils/resumeParser');

function deriveCompanyNameFromEmail(email) {
  const local = String(email || 'company').split('@')[0] || 'company';
  return local
    .replace(/[._-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase()) || 'Company';
}

async function ensureCompanyProfileByUserId(userId) {
  let company = await Company.findByUserId(userId);
  if (company) return company;

  const user = await User.findById(userId);
  if (!user || user.role !== 'company') return null;

  return Company.ensureForUser(userId, {
    companyName: deriveCompanyNameFromEmail(user.email),
    phone: '00000000000',
    industry: 'Other'
  });
}

function getUploadedFile(req, preferredFields = []) {
  if (req.file) return req.file;

  const files = req.files;
  if (!files) return null;

  if (Array.isArray(files)) {
    for (const field of preferredFields) {
      const match = files.find((file) => file?.fieldname === field);
      if (match) return match;
    }
    return files[0] || null;
  }

  for (const field of preferredFields) {
    if (Array.isArray(files[field]) && files[field][0]) {
      return files[field][0];
    }
  }

  return null;
}

const userController = {
  // Get all users (Admin only)
  getAllUsers: async (req, res) => {
    try {
      const filters = {
        role: req.query.role,
        isActive: req.query.isActive !== undefined ? req.query.isActive === 'true' : undefined
      };

      const users = await User.findAll(filters);

      res.json({ users });
    } catch (error) {
      console.error('Get all users error:', error);
      res.status(500).json({ error: 'Failed to fetch users' });
    }
  },

  // Get all companies (Admin only)
  getAllCompanies: async (req, res) => {
    try {
      const companyUsers = await User.findAll({ role: 'company' });
      await Promise.all(
        companyUsers.map((user) => ensureCompanyProfileByUserId(user.id))
      );

      const filters = {
        isActive: req.query.isActive !== undefined ? req.query.isActive === 'true' : undefined,
        isVerified: req.query.isVerified !== undefined ? req.query.isVerified === 'true' : undefined,
        industry: req.query.industry
      };

      const companies = await Company.findAll(filters);

      res.json({ companies });
    } catch (error) {
      console.error('Get all companies error:', error);
      res.status(500).json({ error: 'Failed to fetch companies' });
    }
  },

  // Get all candidates (Admin only)
  getAllCandidates: async (req, res) => {
    try {
      const filters = {
        isActive: req.query.isActive !== undefined ? req.query.isActive === 'true' : undefined,
        skills: req.query.skills
      };

      const candidates = await Candidate.findAll(filters);

      res.json({ candidates });
    } catch (error) {
      console.error('Get all candidates error:', error);
      res.status(500).json({ error: 'Failed to fetch candidates' });
    }
  },

  // Delete candidate (Admin only)
  deleteCandidate: async (req, res) => {
    const { userId } = req.params;

    try {
      const candidate = await Candidate.findByUserId(userId);
      if (!candidate) {
        return res.status(404).json({ error: 'Candidate not found' });
      }

      const candidateId = candidate.CandidateID || candidate.CandidateId;
      const apps = await ApplicationDoc.find({ CandidateID: Number(candidateId) }, { ApplicationID: 1 }).lean();
      const appIds = apps.map((a) => a.ApplicationID);

      if (appIds.length) {
        await InterviewDoc.deleteMany({ ApplicationID: { $in: appIds } });
      }
      await ApplicationDoc.deleteMany({ CandidateID: Number(candidateId) });
      await CandidateDoc.deleteOne({ CandidateID: Number(candidateId) });
      await User.delete(Number(userId));

      await SystemLog.create({
        userId: req.user.id,
        action: 'CANDIDATE_DELETED',
        entity: 'Candidate',
        entityId: candidateId,
        details: `Candidate ${candidate.FullName || candidate.fullName || userId} deleted by admin`,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });

      res.json({ message: 'Candidate deleted successfully' });
    } catch (error) {
      console.error('Delete candidate error:', error);
      res.status(500).json({
        error: 'Failed to delete candidate',
        message: error.message
      });
    }
  },

  deleteCompany: async (req, res) => {
    const { userId } = req.params;

    try {
      const company = await Company.findByUserId(userId);
      if (!company) {
        return res.status(404).json({ error: 'Company not found' });
      }

      const companyId = company.CompanyID || company.CompanyId;
      const jobs = await JobDoc.find({ CompanyID: Number(companyId) }, { JobID: 1 }).lean();
      const jobIds = jobs.map((j) => j.JobID);
      const apps = jobIds.length
        ? await ApplicationDoc.find({ JobID: { $in: jobIds } }, { ApplicationID: 1 }).lean()
        : [];
      const appIds = apps.map((a) => a.ApplicationID);

      if (appIds.length) {
        await InterviewDoc.deleteMany({ ApplicationID: { $in: appIds } });
      }
      if (jobIds.length) {
        await ApplicationDoc.deleteMany({ JobID: { $in: jobIds } });
      }
      await JobDoc.deleteMany({ CompanyID: Number(companyId) });
      await CompanyDoc.deleteOne({ CompanyID: Number(companyId) });
      await User.delete(Number(userId));

      await SystemLog.create({
        userId: req.user.id,
        action: 'COMPANY_DELETED',
        entity: 'Company',
        entityId: companyId,
        details: `Company ${company.CompanyName || company.companyName || userId} deleted by admin`,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });

      res.json({ message: 'Company deleted successfully' });
    } catch (error) {
      console.error('Delete company error:', error);
      res.status(500).json({ error: 'Failed to delete company', message: error.message });
    }
  },

  // Update company profile
  updateCompanyProfile: async (req, res) => {
    try {
      const company = await Company.findByUserId(req.user.id);
      
      if (!company) {
        return res.status(404).json({ error: 'Company profile not found' });
      }

      const logoFile = getUploadedFile(req, ['logo', 'companyLogo']);
      if (logoFile) {
        req.body.logo = toPublicUploadPath(logoFile.path);
      }

      const companyId = company.CompanyID || company.companyId || company.id;
      const updatedCompany = await Company.update(companyId, req.body);

      await SystemLog.create({
        userId: req.user.id,
        action: 'PROFILE_UPDATED',
        entity: 'Company',
        entityId: companyId,
        details: 'Company profile updated',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });

      res.json({
        message: 'Profile updated successfully',
        company: convertToCamelCase(updatedCompany)
      });
    } catch (error) {
      console.error('Update company profile error:', error);
      res.status(500).json({ error: 'Failed to update profile' });
    }
  },

  // Update candidate profile
  updateCandidateProfile: async (req, res) => {
    try {
      console.log('\n========== UPDATE CANDIDATE PROFILE START ==========');
      console.log('User ID:', req.user?.id);
      console.log('User Role:', req.user?.role);
      console.log('Request body:', JSON.stringify(req.body, null, 2));
      
      // Get candidate from database
      const candidate = await Candidate.findByUserId(req.user.id);
      
      if (!candidate) {
        console.error('Candidate not found for user ID:', req.user.id);
        return res.status(404).json({ error: 'Candidate profile not found' });
      }
      
      console.log('Found candidate:', {
        CandidateID: candidate.CandidateID,
        userId: candidate.userId,
        FullName: candidate.FullName
      });

      let extractedData = null;
      let extractedFields = [];

      const resumeFile = getUploadedFile(req, ['resume']);
      const profilePictureFile = getUploadedFile(req, ['profilePicture', 'photo', 'avatar', 'profileImage']);

      // Handle file upload
      if (resumeFile) {
        req.body.resumeLink = toPublicUploadPath(resumeFile.path);
        console.log('Resume file uploaded:', resumeFile.path);

        try {
          const resumeText = await extractTextFromResume(resumeFile.path);
          extractedData = extractResumeProfileData(resumeText);
          extractedFields = Object.keys(extractedData || {}).filter((key) => extractedData[key] !== undefined && extractedData[key] !== null && String(extractedData[key]).trim() !== '');
          console.log('Resume parsing extracted fields:', extractedFields);
        } catch (parseError) {
          console.warn('Resume parsing failed (non-blocking):', parseError?.message || parseError);
        }
      }

      if (profilePictureFile) {
        req.body.profilePicture = toPublicUploadPath(profilePictureFile.path);
        console.log('Profile picture uploaded:', profilePictureFile.path);
      }

      // Build update payload - be very explicit
      const updatePayload = {};
      
      // Handle name
      if (req.body.firstName || req.body.lastName) {
        const first = String(req.body.firstName || '').trim();
        const last = String(req.body.lastName || '').trim();
        updatePayload.fullName = (first + ' ' + last).trim();
        console.log('Setting fullName:', updatePayload.fullName);
      } else if (extractedData?.fullName) {
        updatePayload.fullName = extractedData.fullName;
        console.log('Auto-filled fullName from resume:', updatePayload.fullName);
      }

      // Handle phone
      if (req.body.phone) {
        updatePayload.phone = String(req.body.phone).trim();
        console.log('Setting phone:', updatePayload.phone);
      } else if (extractedData?.phone) {
        updatePayload.phone = extractedData.phone;
        console.log('Auto-filled phone from resume:', updatePayload.phone);
      }

      // Handle skills
      if (req.body.skills !== undefined && req.body.skills !== null) {
        if (Array.isArray(req.body.skills)) {
          updatePayload.skills = req.body.skills.join(',');
        } else if (typeof req.body.skills === 'string') {
          updatePayload.skills = req.body.skills;
        } else {
          updatePayload.skills = String(req.body.skills);
        }
        console.log('Setting skills:', updatePayload.skills);
      } else if (extractedData?.skills) {
        updatePayload.skills = extractedData.skills;
        console.log('Auto-filled skills from resume:', updatePayload.skills);
      }

      // Handle experience
      if (req.body.experience !== undefined && req.body.experience !== null && req.body.experience !== '') {
        const expNum = parseInt(String(req.body.experience).trim(), 10);
        if (!isNaN(expNum) && expNum >= 0) {
          updatePayload.experienceYears = expNum;
          console.log('Setting experienceYears:', expNum);
        } else {
          console.warn('Invalid experience value:', req.body.experience);
        }
      } else if (extractedData?.experienceYears !== undefined) {
        updatePayload.experienceYears = extractedData.experienceYears;
        console.log('Auto-filled experienceYears from resume:', updatePayload.experienceYears);
      }

      // Handle location
      if (req.body.location !== undefined) {
        updatePayload.location = String(req.body.location || '').trim();
      } else if (extractedData?.location) {
        updatePayload.location = extractedData.location;
      }

      // Handle education
      if (req.body.education !== undefined) {
        updatePayload.education = String(req.body.education || '').trim();
      } else if (extractedData?.education) {
        updatePayload.education = extractedData.education;
      }

      // Handle bio
      if (req.body.bio !== undefined) {
        updatePayload.bio = String(req.body.bio || '').trim();
      } else if (extractedData?.bio) {
        updatePayload.bio = extractedData.bio;
      }

      // Handle linkedin URL
      if (req.body.linkedinUrl !== undefined) {
        updatePayload.linkedinUrl = String(req.body.linkedinUrl || '').trim();
      } else if (extractedData?.linkedinUrl) {
        updatePayload.linkedinUrl = extractedData.linkedinUrl;
      }

      // Handle portfolio URL
      if (req.body.portfolioUrl !== undefined) {
        updatePayload.portfolioUrl = String(req.body.portfolioUrl || '').trim();
      } else if (extractedData?.portfolioUrl) {
        updatePayload.portfolioUrl = extractedData.portfolioUrl;
      }

      // Handle resume link
      if (req.body.resumeLink) {
        updatePayload.resumeLink = String(req.body.resumeLink);
        console.log('Setting resumeLink:', updatePayload.resumeLink);
      }

      if (req.body.profilePicture !== undefined) {
        updatePayload.profilePicture = req.body.profilePicture
          ? String(req.body.profilePicture).trim()
          : null;
      }

      console.log('Final update payload:', JSON.stringify(updatePayload, null, 2));
      console.log('Auto-filled from resume:', extractedFields);

      // Update email in Users table if provided (non-blocking)
      if (req.body.email && String(req.body.email).trim()) {
        try {
          console.log('Updating user email:', req.body.email);
          await User.update(req.user.id, { email: String(req.body.email).trim() });
          console.log('Email updated successfully');
        } catch (emailErr) {
          console.warn('Email update failed (non-blocking):', emailErr.message);
        }
      }

      // Get the candidate ID
      const candidateId = candidate.CandidateID;
      console.log('Calling Candidate.update with candidateId:', candidateId);
      
      // Update candidate
      const updatedCandidate = await Candidate.update(candidateId, updatePayload);
      
      console.log('Candidate.update returned successfully');
      console.log('Updated candidate:', updatedCandidate);

      // Log the activity
      try {
        await SystemLog.create({
          userId: req.user.id,
          action: 'PROFILE_UPDATED',
          entity: 'Candidate',
          entityId: candidateId,
          details: 'Candidate profile updated',
          ipAddress: req.ip,
          userAgent: req.headers['user-agent']
        });
      } catch (logErr) {
        console.warn('Failed to create system log (non-blocking):', logErr.message);
      }

      console.log('========== UPDATE CANDIDATE PROFILE SUCCESS ==========\n');
      
      const responseBody = {
        success: true,
        message: 'Profile updated successfully',
        candidate: convertToCamelCase(updatedCandidate),
        extractedFields: extractedFields || [],
        extractedData: extractedData || {}
      };
      
      if (extractedFields && extractedFields.length > 0) {
        responseBody.autoFilledNotice = `${extractedFields.length} profile field(s) were auto-filled from your resume: ${extractedFields.join(', ')}`;
      }
      
      res.json(responseBody);
    } catch (error) {
      console.error('\n');
      console.error('========== UPDATE CANDIDATE PROFILE ERROR ==========');
      console.error('Error name:', error?.name);
      console.error('Error message:', error?.message);
      console.error('Error code:', error?.code);
      console.error('Error number:', error?.number);
      console.error('Error state:', error?.state);
      console.error('Error class:', error?.class);
      console.error('Error procName:', error?.procName);
      console.error('Full error object:', JSON.stringify(error, null, 2));
      console.error('Stack trace:', error?.stack);
      console.error('========================================================\n');
      
      res.status(500).json({ 
        success: false,
        error: 'Failed to update profile',
        message: error?.message || 'Unknown error',
        errorCode: error?.code || 'UNKNOWN'
      });
    }
  },

  // Toggle user active status (Admin only)
  toggleUserStatus: async (req, res) => {
    try {
      const { userId } = req.params;

      const user = await User.findById(userId);
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Toggle the current status
      const newStatus = !user.isActive;
      await User.update(userId, { isActive: newStatus });

      await SystemLog.create({
        userId: req.user.id,
        action: newStatus ? 'USER_ACTIVATED' : 'USER_DEACTIVATED',
        entity: 'User',
        entityId: userId,
        details: `User status changed to ${newStatus ? 'active' : 'inactive'}`,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });

      res.json({
        message: `User ${newStatus ? 'activated' : 'deactivated'} successfully`,
        isActive: newStatus
      });
    } catch (error) {
      console.error('Toggle user status error:', error);
      res.status(500).json({ error: 'Failed to update user status' });
    }
  },

  // Verify company (Admin only)
  verifyCompany: async (req, res) => {
    try {
      const { userId } = req.params;
      const company = await ensureCompanyProfileByUserId(userId);
      
      if (!company) {
        return res.status(404).json({ error: 'Company not found' });
      }

      const isVerified = req.body?.isVerified !== undefined
        ? !!req.body.isVerified
        : true;
      await Company.update(company.CompanyID, { isVerified });
      await User.update(userId, { isVerified });

      await SystemLog.create({
        userId: req.user.id,
        action: isVerified ? 'COMPANY_VERIFIED' : 'COMPANY_UNVERIFIED',
        entity: 'Company',
        entityId: company.CompanyID,
        details: `Company ${company.CompanyName} ${isVerified ? 'approved' : 'disapproved'}`,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });

      res.json({
        message: `${company.CompanyName} ${isVerified ? 'approved' : 'disapproved'} successfully`,
        isVerified
      });
    } catch (error) {
      console.error('Verify company error:', error);
      res.status(500).json({ error: 'Failed to verify company' });
    }
  },

  // Get company stats
  getCompanyStats: async (req, res) => {
    try {
      const company = await ensureCompanyProfileByUserId(req.user.id);
      
      if (!company) {
        return res.status(404).json({ error: 'Company profile not found' });
      }

      const stats = await Company.getCompanyStats(company.id);

      res.json({ stats });
    } catch (error) {
      console.error('Get company stats error:', error);
      res.status(500).json({ error: 'Failed to fetch statistics' });
    }
  },

  // Get company profile (authenticated)
  getCompanyProfile: async (req, res) => {
    try {
      const company = await ensureCompanyProfileByUserId(req.user.id);

      if (!company) {
        return res.status(404).json({ error: 'Company profile not found' });
      }

      res.json({ company: convertToCamelCase(company) });
    } catch (error) {
      console.error('Get company profile error:', error);
      res.status(500).json({ error: 'Failed to fetch company profile' });
    }
  },

  // Get candidate stats
  getCandidateStats: async (req, res) => {
    try {
      const candidate = await Candidate.findByUserId(req.user.id);
      
      if (!candidate) {
        return res.status(404).json({ error: 'Candidate profile not found' });
      }

      const candidateId = candidate.CandidateID || candidate.CandidateId || candidate.id;
      const stats = await Candidate.getCandidateStats(candidateId);

      // Normalize keys to camelCase for frontend
      res.json({ stats: convertToCamelCase(stats) });
    } catch (error) {
      console.error('Get candidate stats error:', error);
      res.status(500).json({ error: 'Failed to fetch statistics' });
    }
  },

  // Get candidate profile (authenticated)
  getCandidateProfile: async (req, res) => {
    try {
      const candidate = await Candidate.findByUserId(req.user.id);
      if (!candidate) return res.status(404).json({ error: 'Candidate profile not found' });
      res.json({ candidate: convertToCamelCase(candidate) });
    } catch (error) {
      console.error('Get candidate profile error:', error);
      res.status(500).json({ error: 'Failed to fetch profile' });
    }
  },

  // Get system logs (Admin only)
  getSystemLogs: async (req, res) => {
    try {
      const filters = {
        userId: req.query.userId,
        action: req.query.action,
        entity: req.query.entity,
        startDate: req.query.startDate,
        endDate: req.query.endDate,
        limit: parseInt(req.query.limit) || 500,
        offset: parseInt(req.query.offset) || 0
      };

      const logs = await SystemLog.findAll(filters);

      res.json(logs);
    } catch (error) {
      console.error('Get system logs error:', error);
      res.status(500).json({ error: 'Failed to fetch system logs', message: error.message });
    }
  },

  // Get dashboard stats (Admin only)
  getAdminDashboardStats: async (req, res) => {
    try {
      const now = new Date();

      const [
        totalCompanies,
        totalCandidates,
        totalJobs,
        activeJobs,
        totalApplications,
        pendingApplications,
        activeUsers,
        inactiveUsers
      ] = await Promise.all([
        CompanyDoc.countDocuments(),
        CandidateDoc.countDocuments(),
        JobDoc.countDocuments(),
        JobDoc.countDocuments({
          IsActive: true,
          $or: [{ Deadline: null }, { Deadline: { $gte: now } }]
        }),
        ApplicationDoc.countDocuments(),
        ApplicationDoc.countDocuments({ Status: 'Pending' }),
        UserDoc.countDocuments({ isActive: true }),
        UserDoc.countDocuments({ isActive: false })
      ]);

      res.json({
        totalCompanies,
        totalCandidates,
        totalJobs,
        activeJobs,
        totalApplications,
        pendingApplications,
        activeUsers,
        inactiveUsers
      });
    } catch (error) {
      console.error('Get admin dashboard stats error:', error);
      res.status(500).json({ error: 'Failed to fetch dashboard statistics', message: error.message });
    }
  },

  // Delete candidate resume
  deleteResume: async (req, res) => {
    try {
      console.log('Delete resume request for user ID:', req.user?.id);

      // Get candidate from database
      const candidate = await Candidate.findByUserId(req.user.id);
      
      if (!candidate) {
        console.error('Candidate not found for user ID:', req.user.id);
        return res.status(404).json({ error: 'Candidate profile not found' });
      }

      console.log('Deleting resume for candidate:', candidate.CandidateID);

      // Update candidate to remove resume link
      const updateResult = await Candidate.update(candidate.CandidateID, { resumeLink: null });
      
      if (!updateResult) {
        return res.status(500).json({ error: 'Failed to delete resume' });
      }

      console.log('Resume deleted successfully for candidate:', candidate.CandidateID);

      res.json({ 
        success: true, 
        message: 'Resume deleted successfully',
        candidate: {
          CandidateID: candidate.CandidateID,
          FullName: candidate.FullName,
          ResumeLink: null
        }
      });
    } catch (error) {
      console.error('Delete resume error:', error);
      res.status(500).json({ error: 'Failed to delete resume', message: error.message });
    }
  }
};

module.exports = userController;