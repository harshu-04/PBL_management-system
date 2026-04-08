const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema({
  teamNo: { type: String, required: true, unique: true }, // e.g., FULLSTACK_6_01
  name: { type: String }, // Optional vanity name
  subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject' },
  semester: { type: Number },
  leader: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  mentor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  maxSize: { type: Number, default: 4 },
  isLocked: { type: Boolean, default: false },
  progress: { type: Number, default: 0 } // Max 100
}, { timestamps: true });

module.exports = mongoose.model('Team', teamSchema);
