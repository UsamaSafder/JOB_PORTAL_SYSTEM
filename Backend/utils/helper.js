const fs = require('fs');
const path = require('path');

// Delete file helper
const deleteFile = (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error deleting file:', error);
    return false;
  }
};

// Format date helper
const formatDate = (date) => {
  if (!date) return null;
  return new Date(date).toISOString().split('T')[0];
};

// Generate pagination metadata
const getPaginationMeta = (total, page, limit) => {
  const totalPages = Math.ceil(total / limit);
  return {
    total,
    page,
    limit,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1
  };
};

// Sanitize user data (remove sensitive fields)
const sanitizeUser = (user) => {
  if (!user) return null;
  const { password, ...sanitized } = user;
  return sanitized;
};

// Error response helper
const errorResponse = (res, statusCode, message, details = null) => {
  const response = { error: message };
  if (details) response.details = details;
  return res.status(statusCode).json(response);
};

// Success response helper
const successResponse = (res, data, message = 'Success') => {
  return res.json({
    message,
    ...data
  });
};

// Validate file type
const isValidFileType = (filename, allowedTypes) => {
  const ext = path.extname(filename).toLowerCase();
  return allowedTypes.includes(ext);
};

// Generate random string
const generateRandomString = (length = 32) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Convert various DB keys (PascalCase, SNAKE_CASE, acronyms) to camelCase
const toCamelCase = (str) => {
  if (!str || typeof str !== 'string') return str;

  // Replace underscores and spaces with single space for splitting
  const cleaned = str.replace(/[_\s]+/g, ' ').trim();

  // Split into words handling: "JobID" -> ["Job","ID"], "JOB_ID" -> ["JOB","ID"], "PostedAt" -> ["Posted","At"]
  const words = cleaned.match(/([A-Z]+(?=[A-Z][a-z0-9]))|([A-Z]?[a-z0-9]+)|([A-Z]+)|([0-9]+)/g);
  if (!words) return str.charAt(0).toLowerCase() + str.slice(1);

  return words
    .map((w, i) => {
      const lower = w.toLowerCase();
      if (i === 0) return lower;
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join('');
};

// Convert object keys from DB style to camelCase recursively
const convertToCamelCase = (obj) => {
  if (Array.isArray(obj)) {
    return obj.map(item => convertToCamelCase(item));
  }

  if (obj !== null && typeof obj === 'object') {
    // Preserve Date objects and other non-plain objects (Buffer, etc.)
    if (obj instanceof Date) return obj;
    if (Buffer && Buffer.isBuffer && Buffer.isBuffer(obj)) return obj;

    const camelCaseObj = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const camelKey = toCamelCase(key);
        const value = obj[key];
        // Only recurse for plain objects and arrays
        if (value !== null && typeof value === 'object' && !(value instanceof Date) && !(Buffer && Buffer.isBuffer && Buffer.isBuffer(value))) {
          camelCaseObj[camelKey] = convertToCamelCase(value);
        } else {
          camelCaseObj[camelKey] = value;
        }
      }
    }
    return camelCaseObj;
  }

  return obj;
};

module.exports = {
  deleteFile,
  formatDate,
  getPaginationMeta,
  sanitizeUser,
  errorResponse,
  successResponse,
  isValidFileType,
  generateRandomString,
  convertToCamelCase
};