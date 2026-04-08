const User = require('../models/User');

// @desc    Get user profile
// @route   GET /api/profile/me
// @access  Private
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password').populate('teamId');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Update user profile
// @route   PUT /api/profile/update
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const {
      skills, github, linkedin,
      universityRollNo, studentId, semester, section, specialization,
      employeeId, department, expertise, experienceYears, availability
    } = req.body;

    // Optional URL strict validation (you can also use frontend validation, but backend is safer)
    const urlSet = [github, linkedin].filter(Boolean);
    const urlPattern = /^https?:\/\/.+/i;
    for (const link of urlSet) {
      if (!urlPattern.test(link)) {
        return res.status(400).json({ message: `Invalid URL format for: ${link}` });
      }
    }

    // Shared Fields
    if (skills !== undefined) user.skills = skills;
    if (github !== undefined) user.github = github;
    if (linkedin !== undefined) user.linkedin = linkedin;

    // Validate based on Role
    if (user.role === 'Student') {
      if (semester !== undefined) {
        if (isNaN(semester) || semester < 1 || semester > 10) {
          return res.status(400).json({ message: 'Semester must be between 1 and 10' });
        }
        user.semester = semester;
      }
      if (universityRollNo !== undefined) user.universityRollNo = universityRollNo;
      if (studentId !== undefined) user.studentId = studentId;
      if (section !== undefined) user.section = section;
      if (specialization !== undefined) user.specialization = specialization;
    } else if (user.role === 'Mentor') {
      if (experienceYears !== undefined) {
        if (isNaN(experienceYears) || experienceYears < 0) {
          return res.status(400).json({ message: 'Experience years must be a positive number' });
        }
        user.experienceYears = experienceYears;
      }
      if (department !== undefined) user.department = department;
      if (employeeId !== undefined) user.employeeId = employeeId;
      if (availability !== undefined) user.availability = availability;
      if (expertise !== undefined) {
        if (!Array.isArray(expertise) || expertise.length === 0) {
           return res.status(400).json({ message: 'Mentor expertise is required and must be an array' });
        }
        user.expertise = expertise;
      }
    }

    // Notice we do NOT allow updating role, password, or email here
    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      skills: updatedUser.skills,
      github: updatedUser.github,
      linkedin: updatedUser.linkedin,
      // student fields
      universityRollNo: updatedUser.universityRollNo,
      studentId: updatedUser.studentId,
      semester: updatedUser.semester,
      section: updatedUser.section,
      specialization: updatedUser.specialization,
      // mentor fields
      employeeId: updatedUser.employeeId,
      department: updatedUser.department,
      expertise: updatedUser.expertise,
      experienceYears: updatedUser.experienceYears,
      availability: updatedUser.availability,
      teamId: updatedUser.teamId
    });

  } catch (error) {
    if (error.code === 11000) {
       return res.status(400).json({ message: 'Duplicate field entered (e.g. universityRollNo already exists)' });
    }
    console.error('Update Profile Error:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

module.exports = {
  getProfile,
  updateProfile,
};
