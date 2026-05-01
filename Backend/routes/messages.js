const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const messageController = require('../controllers/messageController');
const { auth, requireApprovedCompany } = require('../middleware/auth');

// Setup multer for message file uploads
const messageUploadDir = path.join(__dirname, '../uploads/messages');
if (!fs.existsSync(messageUploadDir)) {
  fs.mkdirSync(messageUploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, messageUploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: (req, file, cb) => {
    // Allow common file types
    const allowedTypes = /jpeg|jpg|png|pdf|doc|docx|txt|zip|xls|xlsx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});

router.post('/conversation', auth, requireApprovedCompany, messageController.createOrGetConversation);
router.get('/applicants/list', auth, requireApprovedCompany, messageController.getApplicants);
router.get('/', auth, messageController.getConversations);
router.get('/:conversationId', auth, messageController.getMessages);
router.post('/:conversationId', auth, upload.single('file'), messageController.sendMessage);

module.exports = router;
