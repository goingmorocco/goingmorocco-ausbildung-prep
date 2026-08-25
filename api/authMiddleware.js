// Shared auth middleware, used by any route that requires a logged-in
// user (authenticateToken) or specifically an admin (requireAdmin).

const jwt = require('jsonwebtoken');
const { users } = require('./db');
// Falls back to a local-dev-only value so `npm start` works out of the box
// without any setup. For any real deployment, set JWT_SECRET as an
// environment variable on the host -- never commit a real secret to git.
const JWT_SECRET = process.env.JWT_SECRET || 'local-dev-only-secret-do-not-use-in-production';

function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'غير مصرح به' });
  }

  const token = authHeader.substring(7);

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    req.userEmail = decoded.email;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'غير مصرح به' });
  }
}

function requireAdmin(req, res, next) {
  const user = users.find(u => u.id === req.userId);
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'هذا الإجراء متاح للمشرفين فقط' });
  }
  req.adminUser = user;
  next();
}

module.exports = { authenticateToken, requireAdmin, JWT_SECRET };
