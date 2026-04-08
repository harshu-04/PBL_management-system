const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Generate JWT with { id, role } payload, 7-day expiry
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// Email format regex
const isValidEmail = (email) => /^\S+@\S+\.\S+$/.test(email);

// ──────────────────────────────────────────────
// POST /api/auth/register
// ──────────────────────────────────────────────
const registerUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // ── Input validation ──
    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: 'All fields are required (name, email, password, role)' });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ message: 'Please provide a valid email address' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    if (!['Mentor', 'Student'].includes(role)) {
      return res.status(400).json({ message: 'Role must be Mentor or Student' });
    }

    // ── Duplicate check ──
    const userExists = await User.findOne({ email: email.toLowerCase() });
    if (userExists) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    // ── Create user (password hashed by pre-save hook) ──
    const user = await User.create({ name, email, password, role });

    // ── Return user + token immediately ──
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      teamId: user.teamId || null,
      token: generateToken(user._id, user.role),
    });
  } catch (err) {
    // Handle Mongoose validation errors gracefully
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ message: messages.join('. ') });
    }
    // Handle duplicate key error (race condition)
    if (err.code === 11000) {
      return res.status(400).json({ message: 'Email already exists' });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

// ──────────────────────────────────────────────
// POST /api/auth/login
// ──────────────────────────────────────────────
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Compare password using model instance method
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Return user + JWT
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      teamId: user.teamId || null,
      token: generateToken(user._id, user.role),
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// ──────────────────────────────────────────────
// GET /api/auth/me  (protected)
// ──────────────────────────────────────────────
const getMe = async (req, res) => {
  const user = await User.findById(req.user._id).select('-password').populate('teamId');
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }
  res.json(user);
};

// ──────────────────────────────────────────────
// GET /api/auth/users  (admin only)
// ──────────────────────────────────────────────
const getUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password').populate('teamId');
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { registerUser, loginUser, getMe, getUsers };
