const express = require('express');
const router = express.Router();
const supportController = require('../controllers/supportController');
const { auth } = require('../middleware/auth');

router.post('/', auth, supportController.createTicket);
router.get('/company', auth, supportController.getCompanyTickets);
router.post('/:ticketId/reply', auth, supportController.replyToTicket);
router.get('/:ticketId', auth, supportController.getTicket);
router.get('/', auth, supportController.getAllTicketsForAdmin);

module.exports = router;
