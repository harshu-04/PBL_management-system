const jwt = require('jsonwebtoken');
const User = require('../models/User');

// ──────────────────────────────────────────────
// Auth Middleware — Verify JWT from Authorization header
// ──────────────────────────────────────────────
const protect = async (req, res, next) => {
  // Check for Bearer token in Authorization header
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Not authorized — no token provided' });
  }

  const token = authHeader.split(' ')[1];

  try {
    // Verify token and decode payload { id, role }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach full user object (minus password) to request
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({ message: 'Not authorized — user no longer exists' });
    }

    req.user = user;
    next();
  } catch (error) {
    // Handle specific JWT errors
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Not authorized — token has expired' });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Not authorized — invalid token' });
    }
    return res.status(401).json({ message: 'Not authorized — token verification failed' });
  }
};

module.exports = { protect };
