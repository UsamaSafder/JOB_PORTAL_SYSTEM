const jwt = require('jsonwebtoken');

// Use a conservative default secret during local development so the app "works out of the box".
// IMPORTANT: For production you must set JWT_SECRET in your environment and use a secure value.
const DEFAULT_JWT_SECRET = 'job-portal-dev-secret-change-me';

const generateToken = (userId) => {
  const secret = process.env.JWT_SECRET || DEFAULT_JWT_SECRET;
  const expiresIn = process.env.JWT_EXPIRE || '7d';

  if (!process.env.JWT_SECRET) {
    console.warn('Warning: JWT_SECRET is not set — using a default development secret. Set JWT_SECRET for production deployments.');
  }

  return jwt.sign({ id: userId }, secret, {
    expiresIn
  });
};

module.exports = generateToken;