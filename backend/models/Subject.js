const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  semester: { type: Number, required: true },
  code: { type: String, uppercase: true, required: true, unique: true },
  branch: { type: String, default: 'CSE' },
  coordinator: { type: String },
  description: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Subject', subjectSchema);
