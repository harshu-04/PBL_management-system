const mongoose = require('mongoose');

const SubmissionSchema = new mongoose.Schema({
  teamNo: { type: String, required: true }, // e.g., FULLSTACK_6_01
  phaseNumber: { type: Number, required: true },
  synopsis: { type: String, required: true },
  githubLink: { type: String },
  submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  submittedAt: { type: Date, default: Date.now },
  grade: { type: Number, enum: [0, 1] }, // 0 = Reject, 1 = Accept
  performance: [{
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    marks: { type: Number, min: 0, max: 10 },
    remark: { type: String }
  }]
}, { timestamps: true });

// Prevent duplicate submission per phase for a team
SubmissionSchema.index({ teamNo: 1, phaseNumber: 1 }, { unique: true });

module.exports = mongoose.model('Submission', SubmissionSchema);
