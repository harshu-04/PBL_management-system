const Subject = require('../models/Subject');
const User = require('../models/User');

const getSubjects = async (req, res) => {
  try {
    let filter = {};

    // Semester-based filtering for Students only
    if (req.user.role === 'Student') {
      const profile = await User.findById(req.user.id).select('semester');
      if (!profile?.semester) {
        return res.status(400).json({ message: 'Your profile does not have a semester set. Please complete your profile first.' });
      }
      filter = { semester: profile.semester };
    }

    const subjects = await Subject.find(filter).sort({ semester: 1, name: 1 });
    res.json(subjects);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

const createSubject = async (req, res) => {
  try {
    if (req.user.role !== 'Admin') {
      return res.status(403).json({ message: 'Not authorized as admin' });
    }

    const { name, semester, code, description } = req.body;

    if (!name || !semester || !code) {
      return res.status(400).json({ message: 'Name, semester, and code are required' });
    }

    const subject = await Subject.create({
      name,
      semester,
      code: code.toUpperCase(),
      description
    });

    res.status(201).json(subject);
  } catch (error) {
    res.status(400).json({ message: 'Invalid data', error: error.message });
  }
};

module.exports = {
  getSubjects,
  createSubject
};
