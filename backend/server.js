const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();

app.use(cors());
app.use(express.json());

// Import routes (will be created soon)
const authRoutes = require('./routes/authRoutes');
const phaseRoutes = require('./routes/phaseRoutes');
const submissionRoutes = require('./routes/submissionRoutes');
const teamRoutes = require('./routes/teamRoutes');
const meetingRoutes = require('./routes/meetingRoutes');
const profileRoutes = require('./routes/profileRoutes');
const subjectRoutes = require('./routes/subjectRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/phase', phaseRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/meetings', meetingRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/subjects', subjectRoutes);

const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/pbl')
  .then(() => {
    console.log('MongoDB connected');
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch(err => console.error(err));
