const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const jobController = require('../controllers/jobController');
const { auth, authorize, optionalAuth } = require('../middleware/auth');
const { validate } = require('../middleware/validator');

// Validation rules
const jobValidation = [
  body('title').notEmpty().withMessage('Job title is required'),
  body('description').notEmpty().withMessage('Job description is required'),
  body('location').notEmpty().withMessage('Location is required'),
  body('employmentType')
    .isIn(['Full-time', 'Part-time', 'Contract', 'Internship'])
    .withMessage('Invalid employment type'),
  validate
];

// Public routes (no auth required, but optional auth for personalization)
router.get('/', optionalAuth, jobController.getAllJobs);
// Company routes (must come before the generic parametrized routes)
router.post('/', auth, authorize('company'), jobValidation, jobController.createJob);
// Specific company routes (must come BEFORE parametrized routes like :companyId)
router.get('/company/my-jobs', auth, authorize('company'), jobController.getCompanyJobs);
// Candidate-specific endpoints (must come before '/:id' so they are not treated as an ID)
router.get('/candidate/recommended', auth, authorize('candidate'), jobController.getRecommendedJobs);

// Get jobs by company ID (public/readable by anyone) — use optionalAuth so the frontend can request without a token
router.get('/company/:companyId', optionalAuth, jobController.getJobsByCompanyId);

// Job-by-id must be after the company-specific paths so it doesn't shadow them
router.get('/:id', optionalAuth, jobController.getJobById);
router.patch('/:id/toggle-status', auth, authorize('company', 'admin'), jobController.toggleJobStatus);
router.put('/:id', auth, authorize('company', 'admin'), jobValidation, jobController.updateJob);
router.delete('/:id', auth, authorize('company', 'admin'), jobController.deleteJob);

// Candidate routes
// Candidate routes (already registered above)

module.exports = router;

