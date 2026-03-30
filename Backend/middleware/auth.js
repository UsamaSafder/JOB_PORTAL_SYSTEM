const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Company = require('../models/Company');
const Candidate = require('../models/Candidate');

function normalizeCompanyApprovalStatus(company) {
  if (!company) return false;
  if (company.isVerified !== undefined) return !!company.isVerified;
  if (company.IsVerified !== undefined) return !!company.IsVerified;
  if (company.UserIsVerified !== undefined) return !!company.UserIsVerified;
  return false;
}

const auth = async (req, res, next) => {
  try {
    const rawAuth = req.header('Authorization');
    // Log incoming Authorization header for debugging
    console.log('Auth header received:', rawAuth ? rawAuth.substring(0, 100) : rawAuth);
    const token = rawAuth?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Token decoded payload:', { id: decoded.id, role: decoded.role });

    // Token always contains userId and role.
    const userRow = await User.findById(decoded.id);

    if (!userRow) {
      return res.status(401).json({ error: 'User not found' });
    }

    // Normalize common column casings (some queries alias to IsActive etc.)
    const userIsActive = (userRow.isActive !== undefined) ? userRow.isActive :
      (userRow.IsActive !== undefined ? userRow.IsActive :
        (userRow.Isactive !== undefined ? userRow.Isactive : null));

    // If explicit false/0 -> deactivated
    if (userIsActive === 0 || userIsActive === false) {
      return res.status(403).json({ error: 'Account is deactivated' });
    }

    // Use role from token (since token was generated with the correct role)
    const userRole = decoded.role || userRow.role || 'user';

    // Now look up additional info based on the role
    let companyId = null;
    let candidateId = null;
    let companyIsVerified = null;

    if (userRole === 'company') {
      const comp = await Company.findByUserId(decoded.id);
      console.log('Company lookup result:', comp ? [{ CompanyID: comp.CompanyID }] : []);

      if (comp) {
        companyId = comp.CompanyID;
        companyIsVerified = normalizeCompanyApprovalStatus(comp);
      } else {
        console.warn('No company found for userId:', decoded.id);
      }
    } else if (userRole === 'candidate') {
      const cand = await Candidate.findByUserId(decoded.id);
      console.log('Candidate lookup result:', cand ? [{ CandidateID: cand.CandidateID }] : []);

      if (cand) {
        candidateId = cand.CandidateID;
      } else {
        console.warn('No candidate found for userId:', decoded.id);
      }
    }

    // Normalize req.user: provide id (Users.id) and role
    req.user = {
      id: userRow.id,
      role: userRole,
      email: userRow.email,
      companyId: companyId,
      candidateId: candidateId,
      companyIsVerified,
      ...userRow
    };
    
    req.token = token;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error && error.name ? error.name : error);
    // Also log the raw Authorization header when an error occurs (for debugging)
    try { console.error('Auth header on error:', req.header('Authorization')); } catch (e) {}
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    res.status(500).json({ error: 'Authentication failed' });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'You do not have permission to perform this action' 
      });
    }

    next();
  };
};

const optionalAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      const userRow = await User.findById(decoded.id);

      if (userRow && userRow.isActive) {
        // Look up additional info based on role
        let companyId = null;
        let candidateId = null;
        let companyIsVerified = null;

        const userRole = decoded.role || userRow.role || 'user';

        if (userRole === 'company') {
          const comp = await Company.findByUserId(decoded.id);
          if (comp) {
            companyId = comp.CompanyID;
            companyIsVerified = normalizeCompanyApprovalStatus(comp);
          }
        } else if (userRole === 'candidate') {
          const cand = await Candidate.findByUserId(decoded.id);
          if (cand) candidateId = cand.CandidateID;
        }

        req.user = {
          id: userRow.id,
          role: userRole,
          email: userRow.email,
          companyId: companyId,
          candidateId: candidateId,
          companyIsVerified,
          ...userRow
        };
      }
    }
    
    next();
  } catch (error) {
    // Silent fail for optional auth
    next();
  }
};

const requireApprovedCompany = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (req.user.role !== 'company') {
      return next();
    }

    let isApproved = req.user.companyIsVerified;

    if (isApproved === null || isApproved === undefined) {
      const company = await Company.findByUserId(req.user.id);
      isApproved = normalizeCompanyApprovalStatus(company);
    }

    if (!isApproved) {
      return res.status(403).json({
        error: 'Company account is pending admin approval. Access is restricted until verification is complete.'
      });
    }

    next();
  } catch (error) {
    console.error('Company approval middleware error:', error);
    return res.status(500).json({ error: 'Failed to verify company approval status' });
  }
};

module.exports = { auth, authorize, optionalAuth, requireApprovedCompany };