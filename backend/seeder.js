const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Models
const User = require('./models/User');
const Team = require('./models/Team');
const Subject = require('./models/Subject');
const GlobalSettings = require('./models/GlobalSettings');
const Submission = require('./models/Submission');
const Meeting = require('./models/Meeting');
const TeamCounter = require('./models/TeamCounter');

dotenv.config({ path: path.join(__dirname, '.env') });

mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/pbl');

const wipeEverything = async () => {
  try {
    console.log('💥 HARD WIPE: Deleting all data...');
    
    // NUCLEAR DELETE - Every single collection
    await Promise.all([
      User.deleteMany(),
      Team.deleteMany(),
      Subject.deleteMany(),
      GlobalSettings.deleteMany(),
      Submission.deleteMany(),
      Meeting.deleteMany(),
      TeamCounter.deleteMany()
    ]);
    
    console.log('✅ All collections cleared.');

    // RE-INITIALIZE SYSTEM
    // 1. Reset Global Phase to 1
    await GlobalSettings.create({ currentPhase: 1, completedPhases: [] });

    // 2. Re-create ONLY the Master Admin (So you can log back in)
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@pbl.com',
      password: 'password123',
      role: 'Admin'
    });

    console.log('\n--- SYSTEM RESET COMPLETE ---');
    console.log('Target: ALL USERS AND DATA DELETED');
    console.log('Master Admin Restored: admin@pbl.com / password123');
    
    process.exit();
  } catch (error) {
    console.error('❌ Error during hard wipe:', error);
    process.exit(1);
  }
};

wipeEverything();
