const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const applicationController = require('../controllers/applicationController');
const { auth, authorize, requireApprovedCompany } = require('../middleware/auth');
const { uploadResume, handleMulterError } = require('../middleware/upload');
const { validate } = require('../middleware/validator');

// Validation rules
const applicationValidation = [
  body('jobId').isInt().withMessage('Valid job ID is required'),
  body('coverLetter').optional().isString(),
  validate
];

const interviewValidation = [
  body('interviewDate').isISO8601().withMessage('Valid interview date is required'),
  body('interviewType')
    .isIn(['phone', 'video', 'in-person', 'technical'])
    .withMessage('Invalid interview type'),
  body('interviewerName').notEmpty().withMessage('Interviewer name is required'),
  validate
];

// Candidate routes - non-parameterized
router.post(
  '/',
  auth,
  authorize('candidate'),
  uploadResume.single('resume'),
  handleMulterError,
  applicationValidation,
  applicationController.submitApplication
);
router.get('/my-applications', auth, authorize('candidate'), applicationController.getCandidateApplications);
router.get('/my-interviews', auth, authorize('candidate'), applicationController.getCandidateInterviews);

// Company routes - specific named routes
router.get('/company/received', auth, authorize('company'), requireApprovedCompany, applicationController.getCompanyApplications);
router.get('/job/:jobId', auth, authorize('company'), requireApprovedCompany, applicationController.getApplicationsByJobId);
router.get('/company/:companyId', auth, authorize('company'), requireApprovedCompany, applicationController.getApplicationsByCompanyId);

// IMPORTANT: Specific parameterized routes MUST come BEFORE generic :id routes
// These must be defined in order of specificity (most specific first)

// Candidate reschedule request - most specific (3 segments)
router.post(
  '/:applicationId/interview/:interviewId/request-reschedule',
  auth,
  authorize('candidate'),
  applicationController.requestReschedule
);

// Candidate reschedule request at application level - specific (2 segments)
router.post(
  '/:applicationId/request-reschedule',
  auth,
  authorize('candidate'),
  applicationController.requestApplicationReschedule
);

// Schedule interview - specific (2 segments)
router.post(
  '/:id/schedule-interview',
  auth,
  authorize('company'),
  requireApprovedCompany,
  interviewValidation,
  applicationController.scheduleInterview
);

// Status update - specific (2 segments)
router.patch('/:id/status', auth, authorize('company', 'admin'), requireApprovedCompany, applicationController.updateApplicationStatus);

// Generic routes - must come LAST
router.delete('/:id', auth, authorize('candidate', 'admin'), applicationController.deleteApplication);
router.get('/:id', auth, applicationController.getApplicationById);

module.exports = router;