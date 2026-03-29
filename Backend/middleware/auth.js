const jwt = require('jsonwebtoken');
const { getPool, sql } = require('../config/database');

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

    // Token always contains userId (from Users table) and role
    // Use the userId directly to fetch the user record
    const pool = await getPool();
    const userResult = await pool.request()
      .input('userId', sql.Int, decoded.id)
      .query('SELECT * FROM Users WHERE id = @userId');

    let userRow = userResult.recordset[0];

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

    if (userRole === 'company') {
      const comp = await pool.request()
        .input('userId', sql.Int, decoded.id)
        .query('SELECT CompanyID FROM Companies WHERE userId = @userId');
      
      console.log('Company lookup result:', comp.recordset);
      
      if (comp.recordset[0]) {
        companyId = comp.recordset[0].CompanyID;
      } else {
        console.warn('No company found for userId:', decoded.id);
      }
    } else if (userRole === 'candidate') {
      const cand = await pool.request()
        .input('userId', sql.Int, decoded.id)
        .query('SELECT CandidateID FROM Candidates WHERE userId = @userId');
      
      console.log('Candidate lookup result:', cand.recordset);
      
      if (cand.recordset[0]) {
        candidateId = cand.recordset[0].CandidateID;
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

      // Token contains userId, use it directly
      const pool = await getPool();
      const userResult = await pool.request()
        .input('userId', sql.Int, decoded.id)
        .query('SELECT * FROM Users WHERE id = @userId AND isActive = 1');

      const userRow = userResult.recordset[0];

      if (userRow) {
        // Look up additional info based on role
        let companyId = null;
        let candidateId = null;

        const userRole = decoded.role || userRow.role || 'user';

        if (userRole === 'company') {
          const comp = await pool.request()
            .input('userId', sql.Int, decoded.id)
            .query('SELECT CompanyID FROM Companies WHERE userId = @userId');
          
          if (comp.recordset[0]) {
            companyId = comp.recordset[0].CompanyID;
          }
        } else if (userRole === 'candidate') {
          const cand = await pool.request()
            .input('userId', sql.Int, decoded.id)
            .query('SELECT CandidateID FROM Candidates WHERE userId = @userId');
          
          if (cand.recordset[0]) {
            candidateId = cand.recordset[0].CandidateID;
          }
        }

        req.user = {
          id: userRow.id,
          role: userRole,
          email: userRow.email,
          companyId: companyId,
          candidateId: candidateId,
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

module.exports = { auth, authorize, optionalAuth };