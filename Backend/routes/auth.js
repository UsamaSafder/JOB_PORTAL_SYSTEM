const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const { auth } = require('../middleware/auth');
const { validate } = require('../middleware/validator');

// Validation rules - More flexible for registration
const registerValidation = [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('role')
    .isIn(['admin', 'company', 'candidate'])
    .withMessage('Invalid role'),
  // Conditional validation based on role is handled in controller
  validate
];

const loginValidation = [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required'),
  body('role')
    .optional()
    .isIn(['admin', 'company', 'candidate'])
    .withMessage('Invalid role'),
  validate
];

const changePasswordValidation = [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters long'),
  validate
];

// Routes
router.post('/register', registerValidation, authController.register);
router.post('/login', loginValidation, authController.login);
router.get('/profile', auth, authController.getProfile);
router.put('/change-password', auth, changePasswordValidation, authController.changePassword);
router.post('/logout', auth, authController.logout);
router.post('/init-test-users', authController.initializeTestUsers); // For development only
router.post('/init-test-data', authController.initializeTestData); // For development only

module.exports = router;