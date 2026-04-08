const Team = require('../models/Team');
const TeamCounter = require('../models/TeamCounter');
const Subject = require('../models/Subject');
const User = require('../models/User');
const Submission = require('../models/Submission');
const Meeting = require('../models/Meeting');
const GlobalSettings = require('../models/GlobalSettings');

// @desc    Get teams based on role
// @route   GET /api/teams
const getTeams = async (req, res) => {
  try {
    let teams;
    if (req.user.role === 'Admin') {
      teams = await Team.find().populate('members mentor subjectId');
    } else if (req.user.role === 'Mentor') {
      teams = await Team.find({ mentor: req.user.id }).populate('members subjectId');
    } else {
      teams = await Team.find({ members: req.user.id }).populate('members mentor subjectId');
    }
    res.json(teams);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Get team by teamNo
// @route   GET /api/teams/:teamNo
const getTeamByNo = async (req, res) => {
  try {
    const team = await Team.findOne({ teamNo: req.params.teamNo }).populate('members mentor subjectId');
    if (!team) return res.status(404).json({ message: 'Team not found' });
    res.json(team);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Create a new Team
// @route   POST /api/teams/create
const createTeam = async (req, res) => {
  try {
    const { subjectId, name } = req.body;
    
    // Admin check: Admin can manually create without constraint checking if members is passed
    // But for students, we rigorously enforce Rule A and B.
    
    if (req.user.role === 'Student') {
      // RULE A: Limit Check
      const activeTeamCount = await Team.countDocuments({ members: req.user._id });
      if (activeTeamCount >= 2) {
        return res.status(403).json({ message: 'Constraint Violation: You are already a member of 2 teams.' });
      }
      
      const subject = await Subject.findById(subjectId);
      if (!subject) return res.status(404).json({ message: 'Subject not found' });

      // RULE S: Semester Constraint — Student can only create teams for their own semester
      const studentProfile = await User.findById(req.user.id).select('semester');
      if (!studentProfile?.semester) {
        return res.status(400).json({ message: 'Your profile does not have a semester set. Please update your profile.' });
      }
      if (subject.semester !== studentProfile.semester) {
        return res.status(403).json({ message: `You can only create teams for subjects in your current semester (Sem ${studentProfile.semester}).` });
      }
      
      // RULE C: Atomic teamNo Generation
      const prefix = `${subject.code}_${subject.semester}`;
      
      // `findOneAndUpdate` ensures no two processes get the same seq number
      const counter = await TeamCounter.findByIdAndUpdate(
        prefix,
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
      );
      
      // Format sequence like 01, 02, etc.
      const seqStr = String(counter.seq).padStart(2, '0');
      const teamNo = `${prefix}_${seqStr}`;
      
      // RULE B: Mentor Auto-Assignment (Load Balancing < 8)
      // Find mentors who have fewer than 8 teams, sort by least loaded
      const mentors = await User.find({ role: 'Mentor' });
      let chosenMentorId = null;
      
      // Calculate team load per mentor (A bit heavy, but fine for prototype. In production, we'd aggregate).
      const mentorLoads = await Promise.all(mentors.map(async (m) => {
        const count = await Team.countDocuments({ mentor: m._id });
        return { id: m._id, load: count };
      }));
      
      // Filter out those with >= 8 teams, then sort ascending by load
      const availableMentors = mentorLoads.filter(m => m.load < 8).sort((a, b) => a.load - b.load);
      
      if (availableMentors.length > 0) {
        chosenMentorId = availableMentors[0].id;
      }

      // Create Team
      const team = await Team.create({
        teamNo,
        name: name || teamNo, // Fallback to teamNo if vanity name not provided
        subjectId: subject._id,
        semester: subject.semester,
        leader: req.user._id,
        members: [req.user._id],
        mentor: chosenMentorId
      });
      
      const populated = await Team.findById(team._id).populate('members mentor subjectId');
      return res.status(201).json(populated);

    } else if (req.user.role === 'Admin') {
        // Simple manual creation by Admin
        const { members, mentor } = req.body;
        // Generate abstract random or specified team number
        const teamNo = `ADMIN_${Date.now()}`;
        const team = await Team.create({ teamNo, name: name || teamNo, members, mentor });
        return res.status(201).json(team);
    } else {
        return res.status(403).json({ message: 'Not authorized to create teams' });
    }

  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: 'Duplicate team entry.' });
    }
    res.status(400).json({ message: err.message });
  }
};

// @desc    Join an existing Team
// @route   POST /api/teams/join
const joinTeam = async (req, res) => {
  try {
    if (req.user.role !== 'Student') {
      return res.status(403).json({ message: 'Only students can join teams.' });
    }

    const { teamNo } = req.body;

    // RULE A: Limit Check
    const activeTeamCount = await Team.countDocuments({ members: req.user._id });
    if (activeTeamCount >= 2) {
      return res.status(403).json({ message: 'Constraint Violation: You are already a member of 2 teams.' });
    }

    const team = await Team.findOne({ teamNo }).populate('members subjectId');
    if (!team) return res.status(404).json({ message: 'Team not found' });

    // RULE S: Semester Constraint — Student can only join teams in their own semester
    const studentProfile = await User.findById(req.user.id).select('semester');
    if (!studentProfile?.semester) {
      return res.status(400).json({ message: 'Your profile does not have a semester set. Please update your profile.' });
    }
    if (team.semester !== studentProfile.semester) {
      return res.status(403).json({ message: `Semester mismatch! This team belongs to Semester ${team.semester}. You are in Semester ${studentProfile.semester}.` });
    }

    // Check if student is already in the team
    if (team.members.some(m => m._id.toString() === req.user._id.toString())) {
        return res.status(400).json({ message: 'You are already in this team' });
    }

    // Check barriers
    if (team.isLocked) {
      return res.status(403).json({ message: 'This team is locked.' });
    }
    if (team.members.length >= team.maxSize) {
      return res.status(403).json({ message: 'This team is full.' });
    }

    // Add member
    team.members.push(req.user._id);
    await team.save();

    const populated = await Team.findById(team._id).populate('members mentor subjectId');
    res.json(populated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// @desc    Delete a Team (Admin Only)
// @route   DELETE /api/teams/:id
const deleteTeam = async (req, res) => {
  try {
    if (req.user.role !== 'Admin') {
      return res.status(403).json({ message: 'Not authorized as admin' });
    }

    const team = await Team.findById(req.params.id);
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    const teamNo = team.teamNo;

    // RULE: Cascading Delete
    // 1. Delete all submissions for this team
    await Submission.deleteMany({ teamNo: teamNo });
    
    // 2. Delete all meetings for this team
    await Meeting.deleteMany({ teamId: team._id });

    // 3. Clear team associations from Users (students)
    await User.updateMany(
      { teamId: team._id },
      { $unset: { teamId: "" } }
    );

    // 4. Delete the team itself
    await Team.findByIdAndDelete(req.params.id);

    res.json({ message: 'Team and all associated data deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getTeams, getTeamByNo, createTeam, joinTeam, deleteTeam };
