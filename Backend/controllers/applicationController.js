const Application = require('../models/Application');
const Candidate = require('../models/Candidate');
const Company = require('../models/Company');
const Interview = require('../models/Interview');
const SystemLog = require('../models/SystemLog');
const { convertToCamelCase } = require('../utils/helper');
const { toPublicUploadPath } = require('../utils/filePath');

const applicationController = {
  // Submit application
  submitApplication: async (req, res) => {
    try {
      const candidate = await Candidate.findByUserId(req.user.id);
      
      if (!candidate) {
        return res.status(404).json({ error: 'Candidate profile not found' });
      }

      // Check for duplicate application
      const existingApplication = await Application.checkDuplicate(
        req.body.jobId,
        candidate.CandidateID
      );

      if (existingApplication) {
        return res.status(400).json({ error: 'You have already applied for this job' });
      }

      const applicationData = {
        jobId: req.body.jobId,
        candidateId: candidate.CandidateID,
        coverLetter: req.body.coverLetter,
        resumePath: req.file ? toPublicUploadPath(req.file.path) : toPublicUploadPath(candidate.ResumeLink)
      };

      const application = await Application.create(applicationData);

      await SystemLog.create({
        userId: req.user.id,
        action: 'APPLICATION_SUBMITTED',
        entity: 'Application',
        entityId: application.ApplicationID,
        details: `Applied for job ID: ${req.body.jobId}`,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });

      res.status(201).json({
        message: 'Application submitted successfully',
        application
      });
    } catch (error) {
      console.error('Submit application error:', error);
      res.status(500).json({ error: 'Failed to submit application', message: error.message });
    }
  },

  // Get candidate's applications
  getCandidateApplications: async (req, res) => {
    try {
      const candidate = await Candidate.findByUserId(req.user.id);
      
      if (!candidate) {
        return res.status(404).json({ error: 'Candidate profile not found' });
      }

      const applications = await Application.findAll({ candidateId: candidate.CandidateID });

      // Convert to camelCase and return array
      res.json(convertToCamelCase(applications));
    } catch (error) {
      console.error('Get candidate applications error:', error);
      res.status(500).json({ error: 'Failed to fetch applications', message: error.message });
    }
  },

  // Get company's received applications
  getCompanyApplications: async (req, res) => {
    try {
      console.log('\n========== GET COMPANY APPLICATIONS START ==========');
      console.log('User ID:', req.user.id);
      console.log('User Role:', req.user.role);
      console.log('Company ID from auth:', req.user.companyId);
      
      let companyId = req.user.companyId;
      
      // If companyId not set in auth middleware, try to look it up
      if (!companyId) {
        console.log('Company ID not in auth, looking up...');
        try {
          const company = await Company.findByUserId(req.user.id);
          console.log('Company lookup result:', company);
          
          if (!company) {
            console.error('Company profile not found for user ID:', req.user.id);
            return res.status(404).json({ error: 'Company profile not found' });
          }
          companyId = company.CompanyID;
          console.log('Using company id from lookup:', companyId);
        } catch (lookupError) {
          console.error('Error looking up company:', lookupError.message);
          return res.status(500).json({ error: 'Failed to lookup company profile', message: lookupError.message });
        }
      }

      if (!companyId) {
        console.error('Company ID is still null/undefined');
        return res.status(400).json({ error: 'Company ID is required' });
      }

      const filters = {
        companyId: companyId,
        status: req.query.status,
        jobId: req.query.jobId
      };

      console.log('Fetching applications with filters:', filters);
      
      const applications = await Application.findAll(filters);

      console.log('Applications found:', applications.length);
      console.log('========== GET COMPANY APPLICATIONS SUCCESS ==========\n');

      // Convert to camelCase and return array
      const result = convertToCamelCase(applications);
      console.log('Converted result type:', typeof result, 'isArray:', Array.isArray(result));
      res.json(result);
    } catch (error) {
      console.error('========== GET COMPANY APPLICATIONS ERROR ==========');
      console.error('Error message:', error.message);
      console.error('Error name:', error.name);
      console.error('Stack:', error.stack);
      console.error('==========\n');
      res.status(500).json({ error: 'Failed to fetch applications', message: error.message, details: error.stack });
    }
  },

  // Get applications by company ID
  getApplicationsByCompanyId: async (req, res) => {
    try {
      const companyId = parseInt(req.params.companyId);
      
      // Verify the company belongs to the logged-in user
      const company = await Company.findByUserId(req.user.id);
      
      if (!company) {
        return res.status(404).json({ error: 'Company profile not found' });
      }
      
      if (company.CompanyID !== companyId && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Not authorized to view these applications' });
      }

      const filters = {
        companyId: companyId,
        status: req.query.status,
        jobId: req.query.jobId
      };

      const applications = await Application.findAll(filters);

      // Convert to camelCase and return array
      res.json(convertToCamelCase(applications));
    } catch (error) {
      console.error('Get applications by company ID error:', error);
      res.status(500).json({ error: 'Failed to fetch applications', message: error.message });
    }
  },

  // Get applications by job ID
  getApplicationsByJobId: async (req, res) => {
    try {
      const jobId = parseInt(req.params.jobId);
      
      // Verify the company owns the job
      const company = await Company.findByUserId(req.user.id);
      
      if (!company) {
        return res.status(404).json({ error: 'Company profile not found' });
      }

      // Get the job to verify company ownership
      const Job = require('../models/Job');
      const job = await Job.findById(jobId);
      
      if (!job || job.CompanyID !== company.CompanyID) {
        return res.status(403).json({ error: 'Not authorized to view applications for this job' });
      }

      const applications = await Application.findAll({ jobId: jobId });

      // Convert to camelCase and return array
      res.json(convertToCamelCase(applications));
    } catch (error) {
      console.error('Get applications by job ID error:', error);
      res.status(500).json({ error: 'Failed to fetch applications', message: error.message });
    }
  },

  // Get application by ID
  getApplicationById: async (req, res) => {
    try {
      console.log('\n========== GET APPLICATION BY ID START ==========');
      console.log('Application ID:', req.params.id);
      console.log('User ID:', req.user.id);
      console.log('User Role:', req.user.role);
      
      const application = await Application.findById(req.params.id);

      if (!application) {
        console.error('Application not found');
        return res.status(404).json({ error: 'Application not found' });
      }

      console.log('Application found:', {
        ApplicationID: application.ApplicationID,
        CandidateID: application.CandidateID,
        CompanyID: application.CompanyID,
        JobTitle: application.JobTitle
      });

      // Check authorization
      let candidate = null;
      let company = null;
      
      if (req.user.role === 'candidate') {
        candidate = await Candidate.findByUserId(req.user.id);
        console.log('Candidate lookup result:', candidate ? { CandidateID: candidate.CandidateID } : 'Not found');
      } else if (req.user.role === 'company') {
        company = await Company.findByUserId(req.user.id);
        console.log('Company lookup result:', company ? { CompanyID: company.CompanyID } : 'Not found');
      }

      const isAuthorized = 
        req.user.role === 'admin' ||
        (candidate && application.CandidateID === candidate.CandidateID) ||
        (company && (application.CompanyID === company.CompanyID || application.companyId === company.CompanyID));

      console.log('Authorization check:', {
        isAdmin: req.user.role === 'admin',
        isCandidateMatch: candidate ? application.CandidateID === candidate.CandidateID : false,
        isCompanyMatch: company ? (application.CompanyID === company.CompanyID || application.companyId === company.CompanyID) : false,
        isAuthorized: isAuthorized
      });

      if (!isAuthorized) {
        return res.status(403).json({ error: 'Not authorized to view this application' });
      }

      const interview = await Interview.findByApplicationId(application.ApplicationID || req.params.id);

      console.log('========== GET APPLICATION BY ID SUCCESS ==========\n');
      // Convert to camelCase and return the application with any scheduled interview.
      res.json(convertToCamelCase({
        ...application,
        interview: interview ? convertToCamelCase(interview) : null
      }));
    } catch (error) {
      console.error('========== GET APPLICATION BY ID ERROR ==========');
      console.error('Get application error:', error);
      console.error('Error message:', error.message);
      console.error('==========\n');
      res.status(500).json({ error: 'Failed to fetch application', message: error.message });
    }
  },

  // Update application status
  updateApplicationStatus: async (req, res) => {
    try {
      const { status, notes } = req.body;
      const application = await Application.findById(req.params.id);

      if (!application) {
        return res.status(404).json({ error: 'Application not found' });
      }

      // Only company and admin can update status
      const company = await Company.findByUserId(req.user.id);
      const appCompanyId = application.CompanyID || application.companyId;
      
      if (req.user.role !== 'admin' && (!company || appCompanyId !== company.CompanyID)) {
        return res.status(403).json({ error: 'Not authorized to update this application' });
      }

      const updatedApplication = await Application.update(req.params.id, { status, notes });

      await SystemLog.create({
        userId: req.user.id,
        action: 'APPLICATION_STATUS_UPDATED',
        entity: 'Application',
        entityId: req.params.id,
        details: `Status changed to: ${status}`,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });

      res.json({
        message: 'Application status updated successfully',
        application: convertToCamelCase(updatedApplication)
      });
    } catch (error) {
      console.error('Update application status error:', error);
      res.status(500).json({ error: 'Failed to update application status', message: error.message });
    }
  },

  // Delete/Withdraw application
  deleteApplication: async (req, res) => {
    try {
      const application = await Application.findById(req.params.id);

      if (!application) {
        return res.status(404).json({ error: 'Application not found' });
      }

      // Check authorization
      const candidate = await Candidate.findByUserId(req.user.id);
      
      if (req.user.role !== 'admin' && (!candidate || application.CandidateID !== candidate.CandidateID)) {
        return res.status(403).json({ error: 'Not authorized to delete this application' });
      }

      await Application.delete(req.params.id);

      await SystemLog.create({
        userId: req.user.id,
        action: 'APPLICATION_WITHDRAWN',
        entity: 'Application',
        entityId: req.params.id,
        details: 'Application withdrawn',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });

      res.json({ message: 'Application deleted successfully' });
    } catch (error) {
      console.error('Delete application error:', error);
      res.status(500).json({ error: 'Failed to delete application', message: error.message });
    }
  },

  // Schedule interview
  scheduleInterview: async (req, res) => {
    try {
      console.log('\n========== SCHEDULE INTERVIEW START ==========');
      console.log('Application ID:', req.params.id);
      console.log('Request body:', JSON.stringify(req.body, null, 2));
      console.log('User ID:', req.user.id);
      console.log('User Role:', req.user.role);
      
      // Validate required fields
      if (!req.body.interviewDate && !req.body.scheduledDate) {
        return res.status(400).json({ error: 'Interview date (interviewDate or scheduledDate) is required' });
      }
      
      if (!req.body.interviewType && !req.body.mode) {
        return res.status(400).json({ error: 'Interview type/mode is required' });
      }

      if (!req.body.interviewerName) {
        return res.status(400).json({ error: 'Interviewer name is required' });
      }
      
      const application = await Application.findById(req.params.id);

      if (!application) {
        console.log('Application not found');
        return res.status(404).json({ error: 'Application not found' });
      }

      console.log('Application found:', {
        ApplicationID: application.ApplicationID,
        CandidateID: application.CandidateID,
        JobID: application.JobID,
        CompanyID: application.CompanyID
      });

      // Only company can schedule interviews
      const company = await Company.findByUserId(req.user.id);
      
      if (!company) {
        console.log('Company not found for user:', req.user.id);
        return res.status(403).json({ error: 'Company profile not found' });
      }

      console.log('Company found:', { CompanyID: company.CompanyID });

      if (application.CompanyID !== company.CompanyID) {
        console.log('Company ID mismatch:', application.CompanyID, '!==', company.CompanyID);
        return res.status(403).json({ error: 'Not authorized to schedule interview for this application' });
      }

      const interviewData = {
        applicationId: parseInt(req.params.id),
        interviewDate: req.body.interviewDate || req.body.scheduledDate,
        interviewType: req.body.interviewType || req.body.mode,
        location: req.body.location,
        interviewerName: req.body.interviewerName,
        notes: req.body.notes
      };

      console.log('Creating interview with data:', JSON.stringify(interviewData, null, 2));

      const interview = await Interview.create(interviewData);

      console.log('Interview created successfully:', interview);

      await SystemLog.create({
        userId: req.user.id,
        action: 'INTERVIEW_SCHEDULED',
        entity: 'Interview',
        entityId: interview.InterviewID,
        details: `Interview scheduled for application ID: ${req.params.id}`,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });

      console.log('========== SCHEDULE INTERVIEW SUCCESS ==========\n');

      res.status(201).json({
        success: true,
        message: 'Interview scheduled successfully',
        interview: convertToCamelCase(interview)
      });
    } catch (error) {
      console.error('\n========== SCHEDULE INTERVIEW ERROR ==========');
      console.error('Error message:', error.message);
      console.error('Error code:', error.code);
      console.error('Error number:', error.number);
      console.error('Full error:', JSON.stringify(error, null, 2));
      console.error('Stack:', error.stack);
      console.error('===========================================\n');

      res.status(500).json({ 
        error: 'Failed to schedule interview', 
        message: error.message
      });
    }
  },

  // Get candidate's interviews
  getCandidateInterviews: async (req, res) => {
    try {
      const candidate = await Candidate.findByUserId(req.user.id);
      
      if (!candidate) {
        return res.status(404).json({ error: 'Candidate profile not found' });
      }

      const interviews = await Interview.findAll({ candidateId: candidate.CandidateID });

      res.json({ interviews: convertToCamelCase(interviews) });
    } catch (error) {
      console.error('Get candidate interviews error:', error);
      res.status(500).json({ error: 'Failed to fetch interviews', message: error.message });
    }
  },

  // Request reschedule of interview
  requestReschedule: async (req, res) => {
    try {
      console.log('\n========== REQUEST RESCHEDULE START ==========');
      console.log('Application ID:', req.params.applicationId);
      console.log('Interview ID:', req.params.interviewId);
      console.log('User ID:', req.user.id);
      console.log('Request body:', JSON.stringify(req.body, null, 2));
      
      const application = await Application.findById(req.params.applicationId);

      if (!application) {
        console.log('Application not found');
        return res.status(404).json({ error: 'Application not found' });
      }

      // Verify candidate owns this application
      const candidate = await Candidate.findByUserId(req.user.id);
      
      if (!candidate || application.CandidateID !== candidate.CandidateID) {
        console.log('Not authorized to reschedule this interview');
        return res.status(403).json({ error: 'Not authorized to reschedule this interview' });
      }

      const interview = await Interview.findById(req.params.interviewId);

      if (!interview) {
        console.log('Interview not found');
        return res.status(404).json({ error: 'Interview not found' });
      }

      // Update interview status to 'RescheduleRequested'
      const updatedInterview = await Interview.update(req.params.interviewId, { 
        status: 'RescheduleRequested',
        rescheduleReason: req.body.reason || 'Candidate requested reschedule'
      });

      console.log('Interview status updated to RescheduleRequested');

      await SystemLog.create({
        userId: req.user.id,
        action: 'INTERVIEW_RESCHEDULE_REQUESTED',
        entity: 'Interview',
        entityId: req.params.interviewId,
        details: `Candidate requested to reschedule interview for application ID: ${req.params.applicationId}`,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });

      console.log('========== REQUEST RESCHEDULE SUCCESS ==========\n');

      res.json({
        success: true,
        message: 'Reschedule request sent successfully',
        interview: convertToCamelCase(updatedInterview)
      });
    } catch (error) {
      console.error('\n========== REQUEST RESCHEDULE ERROR ==========');
      console.error('Error message:', error.message);
      console.error('Full error:', JSON.stringify(error, null, 2));
      console.error('===========================================\n');

      res.status(500).json({ 
        error: 'Failed to request reschedule', 
        message: error.message
      });
    }
  },

  // Request reschedule at application level (no interview scheduled yet)
  requestApplicationReschedule: async (req, res) => {
    try {
      console.log('\n========== REQUEST APPLICATION RESCHEDULE START ==========');
      console.log('Application ID:', req.params.applicationId);
      console.log('User ID:', req.user.id);
      console.log('Request body:', JSON.stringify(req.body, null, 2));
      
      const application = await Application.findById(req.params.applicationId);

      if (!application) {
        console.log('Application not found');
        return res.status(404).json({ error: 'Application not found' });
      }

      // Verify candidate owns this application
      const candidate = await Candidate.findByUserId(req.user.id);
      
      if (!candidate || application.CandidateID !== candidate.CandidateID) {
        console.log('Not authorized to request reschedule for this application');
        return res.status(403).json({ error: 'Not authorized to request reschedule for this application' });
      }

      // Update application status to 'RescheduleRequested' or add a note
      // For now, just create a system log since there's no interview yet
      await SystemLog.create({
        userId: req.user.id,
        action: 'RESCHEDULE_REQUESTED',
        entity: 'Application',
        entityId: req.params.applicationId,
        details: `Candidate requested to reschedule for application. Reason: ${req.body.reason || 'No reason provided'}`,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });

      console.log('Reschedule request logged');
      console.log('========== REQUEST APPLICATION RESCHEDULE SUCCESS ==========\n');

      res.json({
        success: true,
        message: 'Reschedule request sent successfully to the company',
        application: convertToCamelCase(application)
      });
    } catch (error) {
      console.error('\n========== REQUEST APPLICATION RESCHEDULE ERROR ==========');
      console.error('Error message:', error.message);
      console.error('Full error:', JSON.stringify(error, null, 2));
      console.error('====================================================\n');

      res.status(500).json({ 
        error: 'Failed to request reschedule', 
        message: error.message
      });
    }
  }
};

module.exports = applicationController;