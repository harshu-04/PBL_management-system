const mongoose = require('mongoose');

const teamCounterSchema = new mongoose.Schema({
  _id: { type: String, required: true }, // e.g., "FULLSTACK_6"
  seq: { type: Number, default: 0 }
});

module.exports = mongoose.model('TeamCounter', teamCounterSchema);
