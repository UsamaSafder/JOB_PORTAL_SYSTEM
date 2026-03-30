const Job = require('../models/Job');
const Company = require('../models/Company');
const User = require('../models/User');
const SystemLog = require('../models/SystemLog');
const { convertToCamelCase } = require('../utils/helper');

function deriveCompanyNameFromEmail(email) {
  const local = String(email || 'company').split('@')[0] || 'company';
  return local
    .replace(/[._-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase()) || 'Company';
}

async function ensureCompanyByUserId(userId) {
  let company = await Company.findByUserId(userId);
  if (company) return company;

  const user = await User.findById(userId);
  if (!user || user.role !== 'company') return null;

  company = await Company.ensureForUser(userId, {
    companyName: deriveCompanyNameFromEmail(user.email),
    phone: '00000000000',
    industry: 'Other'
  });

  return company;
}

const jobController = {
  // Create new job
  createJob: async (req, res) => {
    try {
      const company = await ensureCompanyByUserId(req.user.id);
      
      if (!company) {
        return res.status(404).json({ error: 'Company profile not found' });
      }

      const jobData = {
        ...req.body,
        companyId: company.CompanyID
      };

      const job = await Job.create(jobData);

      await SystemLog.create({
        userId: req.user.id,
        action: 'JOB_CREATED',
        entity: 'Job',
        entityId: job.JobID,
        details: `Created job: ${job.Title}`,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });

      res.status(201).json({
        message: 'Job created successfully',
        job
      });
    } catch (error) {
      console.error('Create job error:', error);
      res.status(500).json({ error: 'Failed to create job', message: error.message });
    }
  },

  // Get all jobs (with filters)
  getAllJobs: async (req, res) => {
    try {
      const filters = {
        status: req.query.status || 'active',
        jobType: req.query.jobType,
        employmentType: req.query.employmentType,
        location: req.query.location,
        search: req.query.search,
        excludeExpired: req.query.excludeExpired === 'true' || req.query.excludeExpired === '1',
        limit: parseInt(req.query.limit) || 20,
        offset: parseInt(req.query.offset) || 0
      };

      const jobs = await Job.findAll(filters);

      res.json({
        jobs: convertToCamelCase(jobs),
        total: jobs.length
      });
    } catch (error) {
      console.error('Get jobs error:', error);
      res.status(500).json({ error: 'Failed to fetch jobs', message: error.message });
    }
  },

  // Get job by ID
  getJobById: async (req, res) => {
    try {
      const job = await Job.findById(req.params.id);

      if (!job) {
        return res.status(404).json({ error: 'Job not found' });
      }

      // Convert to camelCase and return the job object
      res.json(convertToCamelCase(job));
    } catch (error) {
      console.error('Get job error:', error);
      res.status(500).json({ error: 'Failed to fetch job', message: error.message });
    }
  },

  // Get company's jobs (using JWT token)
  getCompanyJobs: async (req, res) => {
    try {
      const company = await ensureCompanyByUserId(req.user.id);
      
      if (!company) {
        return res.status(404).json({ error: 'Company profile not found' });
      }

      const jobs = await Job.findAll({ companyId: company.CompanyID });

      // Convert to camelCase and return array
      res.json(convertToCamelCase(jobs));
    } catch (error) {
      console.error('Get company jobs error:', error);
      res.status(500).json({ error: 'Failed to fetch jobs', message: error.message });
    }
  },

  // Get jobs by company ID (for frontend /api/jobs/company/:companyId)
  // This endpoint should be readable by anyone (public listing of a company's jobs).
  getJobsByCompanyId: async (req, res) => {
    try {
      const companyId = parseInt(req.params.companyId);

      // Find company by id to ensure it exists
      const company = await Company.findById(companyId);
      if (!company) {
        return res.status(404).json({ error: 'Company not found' });
      }

      const jobs = await Job.findAll({ companyId: companyId });

      // Convert to camelCase and return array
      res.json(convertToCamelCase(jobs));
    } catch (error) {
      console.error('Get jobs by company ID error:', error);
      res.status(500).json({ error: 'Failed to fetch jobs', message: error.message });
    }
  },

  // Update job
  updateJob: async (req, res) => {
    try {
      const company = await ensureCompanyByUserId(req.user.id);
      
      if (!company) {
        return res.status(404).json({ error: 'Company profile not found' });
      }

      const existingJob = await Job.findById(req.params.id);
      
      if (!existingJob) {
        return res.status(404).json({ error: 'Job not found' });
      }

      if (existingJob.CompanyID !== company.CompanyID && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Not authorized to update this job' });
      }

      const job = await Job.update(req.params.id, req.body);

      await SystemLog.create({
        userId: req.user.id,
        action: 'JOB_UPDATED',
        entity: 'Job',
        entityId: job.JobID,
        details: `Updated job: ${job.Title}`,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });

      res.json({
        message: 'Job updated successfully',
        job
      });
    } catch (error) {
      console.error('Update job error:', error);
      res.status(500).json({ error: 'Failed to update job', message: error.message });
    }
  },

  // Delete job
  deleteJob: async (req, res) => {
    try {
      const company = await ensureCompanyByUserId(req.user.id);
      
      if (!company) {
        return res.status(404).json({ error: 'Company profile not found' });
      }

      const job = await Job.findById(req.params.id);
      
      if (!job) {
        return res.status(404).json({ error: 'Job not found' });
      }

      if (job.CompanyID !== company.CompanyID && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Not authorized to delete this job' });
      }

      await Job.delete(req.params.id);

      await SystemLog.create({
        userId: req.user.id,
        action: 'JOB_DELETED',
        entity: 'Job',
        entityId: req.params.id,
        details: `Deleted job: ${job.Title}`,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });

      res.json({ message: 'Job deleted successfully' });
    } catch (error) {
      console.error('Delete job error:', error);
      res.status(500).json({ error: 'Failed to delete job', message: error.message });
    }
  },

  // Get recommended jobs for candidate
  getRecommendedJobs: async (req, res) => {
    try {
      const Candidate = require('../models/Candidate');
      const candidate = await Candidate.findByUserId(req.user.id);
      
      if (!candidate) {
        return res.status(404).json({ error: 'Candidate profile not found' });
      }

      const jobs = await Job.getRecommendedJobs(candidate.CandidateID, 10);

      res.json({ jobs: convertToCamelCase(jobs) });
    } catch (error) {
      console.error('Get recommended jobs error:', error);
      res.status(500).json({ error: 'Failed to fetch recommended jobs', message: error.message });
    }
  },

  // Toggle job status (activate/deactivate)
  toggleJobStatus: async (req, res) => {
    try {
      let company = null;

      if (req.user.role !== 'admin') {
        company = await ensureCompanyByUserId(req.user.id);

        if (!company) {
          return res.status(404).json({ error: 'Company profile not found' });
        }
      }

      const job = await Job.findById(req.params.id);
      
      if (!job) {
        return res.status(404).json({ error: 'Job not found' });
      }

      if (req.user.role !== 'admin' && job.CompanyID !== company.CompanyID) {
        return res.status(403).json({ error: 'Not authorized to toggle this job status' });
      }

      // Toggle the status
      const newStatus = !job.IsActive;
      const updatedJob = await Job.update(req.params.id, { isActive: newStatus });

      await SystemLog.create({
        userId: req.user.id,
        action: 'JOB_STATUS_TOGGLED',
        entity: 'Job',
        entityId: job.JobID,
        details: `Job status changed to: ${newStatus ? 'active' : 'inactive'}`,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });

      res.json({
        message: `Job ${newStatus ? 'activated' : 'deactivated'} successfully`,
        job: convertToCamelCase(updatedJob)
      });
    } catch (error) {
      console.error('Toggle job status error:', error);
      res.status(500).json({ error: 'Failed to toggle job status', message: error.message });
    }
  }
};

module.exports = jobController;