const multer = require('multer');
const path = require('path');
const fs = require('fs');

const UPLOAD_ROOT = path.resolve(__dirname, '..', 'uploads');
const RESUME_DIR = path.join(UPLOAD_ROOT, 'resumes');
const LOGO_DIR = path.join(UPLOAD_ROOT, 'logos');
const PROFILE_PICTURE_DIR = path.join(UPLOAD_ROOT, 'profile-pictures');

const candidateProfileImageFields = ['profilePicture', 'photo', 'avatar', 'profileImage'];

const isCandidateProfileImageField = (fieldname) => candidateProfileImageFields.includes(fieldname);

// Ensure upload directories exist
const createUploadDirs = () => {
  const dirs = [RESUME_DIR, LOGO_DIR, PROFILE_PICTURE_DIR];
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
};

createUploadDirs();

// Resume storage configuration
const resumeStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, RESUME_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'resume-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Logo storage configuration
const logoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, LOGO_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'logo-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const candidateAssetStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === 'resume') {
      cb(null, RESUME_DIR);
      return;
    }
    cb(null, PROFILE_PICTURE_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    if (file.fieldname === 'resume') {
      cb(null, 'resume-' + uniqueSuffix + path.extname(file.originalname));
      return;
    }
    cb(null, 'profile-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter for resumes (PDF, DOC, DOCX)
const resumeFileFilter = (req, file, cb) => {
  const allowedTypes = /pdf|doc|docx/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('Only PDF, DOC, and DOCX files are allowed for resumes'));
  }
};

// File filter for logos (images only)
const logoFileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('Only JPEG, JPG, PNG, and GIF files are allowed for logos'));
  }
};

const candidateAssetFileFilter = (req, file, cb) => {
  if (file.fieldname === 'resume') {
    return resumeFileFilter(req, file, cb);
  }

  if (isCandidateProfileImageField(file.fieldname)) {
    return logoFileFilter(req, file, cb);
  }

  return cb(new Error('Unsupported upload field'));
};

// Multer upload instances
const uploadResume = multer({
  storage: resumeStorage,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024 }, // 5MB default
  fileFilter: resumeFileFilter
});

const uploadLogo = multer({
  storage: logoStorage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB for logos
  fileFilter: logoFileFilter
});

const uploadCandidateAssets = multer({
  storage: candidateAssetStorage,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024 },
  fileFilter: candidateAssetFileFilter
});

// Error handling middleware for multer
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File size is too large' });
    }
    return res.status(400).json({ error: err.message });
  } else if (err) {
    return res.status(400).json({ error: err.message });
  }
  next();
};

module.exports = {
  uploadResume,
  uploadLogo,
  uploadCandidateAssets,
  candidateProfileImageFields,
  handleMulterError
};