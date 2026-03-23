const jwt = require('jsonwebtoken');

const SECRET = process.env.JWT_SECRET || 'rento_jwt_super_secret_2024';

/** Require valid JWT */
const protect = (req, res, next) => {
  const header = req.headers['authorization'];
  const token  = header && header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ success: false, message: 'No token – access denied.' });
  try {
    req.user = jwt.verify(token, SECRET);
    next();
  } catch {
    return res.status(403).json({ success: false, message: 'Invalid or expired token.' });
  }
};

/** Require admin or staff role */
const staffOnly = (req, res, next) => {
  protect(req, res, () => {
    if (!['admin', 'staff'].includes(req.user.role))
      return res.status(403).json({ success: false, message: 'Staff access required.' });
    next();
  });
};

/** Require admin role only */
const adminOnly = (req, res, next) => {
  protect(req, res, () => {
    if (req.user.role !== 'admin')
      return res.status(403).json({ success: false, message: 'Admin access required.' });
    next();
  });
};

module.exports = { protect, staffOnly, adminOnly };
