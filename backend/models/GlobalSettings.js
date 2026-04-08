const mongoose = require('mongoose');

const GlobalSettingsSchema = new mongoose.Schema({
  currentPhase: { type: Number, default: 1 },
  completedPhases: [{ type: Number }], // Array to track phases already passed
}, { timestamps: true });

// Ensure it's treated as a singleton
module.exports = mongoose.model('GlobalSettings', GlobalSettingsSchema);
