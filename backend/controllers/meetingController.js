const Meeting = require('../models/Meeting');
const Team = require('../models/Team');

const getMeetings = async (req, res) => {
  try {
    let meetings;
    if (req.user.role === 'Mentor') {
      meetings = await Meeting.find({ mentorId: req.user.id }).populate('teamId');
    } else if (req.user.role === 'Student') {
      // Find all teams the student belongs to
      const teams = await Team.find({ members: req.user.id });
      const teamIds = teams.map(t => t._id);
      meetings = await Meeting.find({ teamId: { $in: teamIds } }).populate('mentorId teamId');
    } else {
      meetings = await Meeting.find().populate('teamId mentorId');
    }
    res.json(meetings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const requestMeeting = async (req, res) => {
  try {
    const { requestedTime, mentorId, teamId } = req.body;
    
    if (!teamId) return res.status(400).json({ message: 'teamId is required' });

    // Validate the student is in the team
    const team = await Team.findById(teamId);
    if (!team || !team.members.includes(req.user.id)) {
       return res.status(403).json({ message: 'Not authorized manually request meeting for this team.'});
    }

    const meeting = await Meeting.create({ teamId, mentorId, requestedTime });
    res.status(201).json(meeting);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

const updateMeetingStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const meeting = await Meeting.findById(req.params.id);
    if (!meeting) return res.status(404).json({ message: 'Meeting not found' });

    if (req.user.role === 'Mentor' && meeting.mentorId.toString() !== req.user.id) {
       return res.status(403).json({ message: 'Not authorized' });
    }

    meeting.status = status;
    await meeting.save();
    res.json(meeting);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getMeetings, requestMeeting, updateMeetingStatus };
