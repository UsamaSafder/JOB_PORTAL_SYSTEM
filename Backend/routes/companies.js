const express = require('express');
const router = express.Router();
const companyController = require('../controllers/companyController');
const { optionalAuth } = require('../middleware/auth');

// Public company profile route
router.get('/:id', optionalAuth, companyController.getCompanyById);

module.exports = router;
