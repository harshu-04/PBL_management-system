const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
  },
  role: {
    type: String,
    enum: {
      values: ['Admin', 'Mentor', 'Student'],
      message: 'Role must be Admin, Mentor, or Student',
    },
    required: [true, 'Role is required'],
  },
  teamId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
  },
  // --- Shared Profile Fields ---
  skills: [{ type: String }],
  github: { type: String, trim: true },
  linkedin: { type: String, trim: true },

  // --- Student-Specific Fields ---
  universityRollNo: { type: String, sparse: true, unique: true, trim: true },
  studentId: { type: String, trim: true },
  semester: { type: Number, min: 1, max: 10 },
  section: { type: String, trim: true },
  specialization: { type: String, trim: true },

  // --- Mentor-Specific Fields ---
  employeeId: { type: String, trim: true },
  department: { type: String, trim: true },
  expertise: [{ type: String }],
  experienceYears: { type: Number, min: 0 },
  availability: { type: Boolean, default: true },

}, { timestamps: true });

// Pre-save hook: hash password before storing — NEVER store plaintext
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Instance method: compare candidate password against hashed password
userSchema.methods.matchPassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
