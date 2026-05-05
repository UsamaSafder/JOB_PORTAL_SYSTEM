const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { auth, authorize, requireApprovedCompany } = require('../middleware/auth');
const { uploadLogo, uploadCandidateAssets, candidateProfileImageFields, handleMulterError } = require('../middleware/upload');

// Admin routes
router.get('/admin/users', auth, authorize('admin'), userController.getAllUsers);
router.get('/admin/companies', auth, authorize('admin'), userController.getAllCompanies);
router.get('/admin/candidates', auth, authorize('admin'), userController.getAllCandidates);
router.delete('/admin/candidates/:userId', auth, authorize('admin'), userController.deleteCandidate);
router.delete('/admin/companies/:userId', auth, authorize('admin'), userController.deleteCompany);
router.get('/admin/dashboard-stats', auth, authorize('admin'), userController.getAdminDashboardStats);
router.get('/admin/logs', auth, authorize('admin'), userController.getSystemLogs);
router.put('/admin/:userId/toggle-status', auth, authorize('admin'), userController.toggleUserStatus);
router.put('/admin/:userId/verify-company', auth, authorize('admin'), userController.verifyCompany);

// Company routes
router.put(
  '/company/profile',
  auth,
  authorize('company'),
  requireApprovedCompany,
  uploadLogo.any(),
  handleMulterError,
  userController.updateCompanyProfile
);
router.get('/company/profile', auth, authorize('company'), requireApprovedCompany, userController.getCompanyProfile);
router.get('/company/stats', auth, authorize('company'), requireApprovedCompany, userController.getCompanyStats);

// Candidate routes
router.put(
  '/candidate/profile',
  auth,
  authorize('candidate'),
  uploadCandidateAssets.any(),
  handleMulterError,
  userController.updateCandidateProfile
);
router.get('/candidate/stats', auth, authorize('candidate'), userController.getCandidateStats);
router.get('/candidate/profile', auth, authorize('candidate'), userController.getCandidateProfile);
router.get('/candidate/resumes', auth, authorize('candidate'), userController.getCandidateResumes);
router.delete('/:candidateId/resume', auth, authorize('candidate'), userController.deleteResume);

module.exports = router;