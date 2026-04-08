const Submission = require('../models/Submission');
const Team = require('../models/Team');
const GlobalSettings = require('../models/GlobalSettings');

// POST /submit (Student Only)
const submitPhase = async (req, res) => {
  try {
    const { teamNo, githubLink } = req.body;
    const synopsis = req.file ? req.file.path : req.body.synopsis;

    if (!teamNo || !synopsis) {
      return res.status(400).json({ message: 'Missing required fields (teamNo, synopsis file/URL)' });
    }

    const team = await Team.findOne({ teamNo });
    if (!team) return res.status(404).json({ message: 'Team not found' });
    if (!team.members.includes(req.user.id)) {
      return res.status(403).json({ message: 'Not authorized for this team' });
    }

    const set = await GlobalSettings.findOne() || { currentPhase: 1 };
    const currentPhaseNumber = set.currentPhase;

    // ACADEMIC GUARDRAIL: Conditional Resubmission
    const existing = await Submission.findOne({ teamNo, phaseNumber: currentPhaseNumber });
    
    if (existing) {
      if (existing.grade === 1) {
        return res.status(400).json({ message: `Conflict: Phase ${currentPhaseNumber} already cleared and cannot be resubmitted.` });
      }
      // Check for pending (null or undefined)
      if (existing.grade === null || existing.grade === undefined) {
        return res.status(400).json({ message: 'Conflict: Previous submission is awaiting mentor review.' });
      }

      // If grade is 0 (Rejected), ALLOW OVERWRITE
      if (existing.grade === 0) {
        existing.synopsis = synopsis;
        existing.githubLink = githubLink;
        existing.grade = null; // Reset to pending
        existing.feedback = 'Resubmitted after rejection'; 
        await existing.save();
        return res.json({ message: 'Resubmitted successfully.', submission: existing });
      }
    }

    // Normal Submission
    const submission = await Submission.create({
      teamNo,
      phaseNumber: currentPhaseNumber,
      synopsis,
      githubLink,
      submittedBy: req.user.id
    });

    // Update Team Progress (+20 base submission bonus)
    team.progress = Math.min((team.progress || 0) + 20, 100);
    await team.save();

    res.status(201).json(submission);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: 'Phase already submitted by team' });
    }
    res.status(500).json({ message: err.message });
  }
};

// POST /grade (Mentor Only)
const gradeSubmission = async (req, res) => {
  try {
    const { grade, performance } = req.body;
    const submissionId = req.params.id;

    if (![0, 1].includes(grade) || !Array.isArray(performance)) {
      return res.status(400).json({ message: 'Invalid grading payload' });
    }

    const submission = await Submission.findById(submissionId);
    if (!submission) return res.status(404).json({ message: 'Submission not found' });

    const team = await Team.findOne({ teamNo: submission.teamNo });
    if (!team) return res.status(404).json({ message: 'Team not found' });

    // Validate mentor authorization
    if (team.mentor?.toString() !== req.user.id) {
       return res.status(403).json({ message: 'Not authorized to grade this team' });
    }

    const settings = await GlobalSettings.findOne() || { currentPhase: 1 };
    const activePhase = settings.currentPhase;

    if (submission.phaseNumber !== activePhase) {
      return res.status(400).json({ message: `Cannot grade an inactive phase. Active system phase is Phase ${activePhase}` });
    }

    if (submission.grade !== undefined && submission.grade !== null) {
      return res.status(400).json({ message: 'Submission already graded' });
    }

    submission.grade = grade;
    submission.performance = performance;
    await submission.save();

    // Progress math
    if (grade === 1) {
      const bonus = (submission.phaseNumber === 3) ? 20 : 10;
      team.progress = Math.min((team.progress || 0) + bonus, 100);
      await team.save();
    }

    res.json(submission);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /team/:teamNo 
const getTeamSubmissions = async (req, res) => {
  try {
    const submissions = await Submission.find({ teamNo: req.params.teamNo }).populate('submittedBy', 'name email').populate('performance.studentId', 'name email').sort({ phaseNumber: 1 });
    res.json(submissions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /report/:teamNo (Mentor - Phase 3)
const getTeamReport = async (req, res) => {
  try {
    const { teamNo } = req.params;
    
    // Auth check
    const team = await Team.findOne({ teamNo }).populate('members', 'name email');
    if (!team) return res.status(404).json({ message: 'Team not found' });

    if (req.user.role === 'Mentor' && team.mentor?.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Get all submissions for team
    const submissions = await Submission.find({ teamNo });
    
    // Aggregation maps
    const studentReportMap = {};
    team.members.forEach(m => {
      studentReportMap[m._id.toString()] = {
        student: m,
        totalMarks: 0,
        remarks: []
      };
    });

    submissions.forEach(sub => {
      if (sub.performance && Array.isArray(sub.performance)) {
        sub.performance.forEach(p => {
          const sId = p.studentId.toString();
          if (studentReportMap[sId]) {
            studentReportMap[sId].totalMarks += (p.marks || 0);
            if (p.remark) {
              studentReportMap[sId].remarks.push(`Phase ${sub.phaseNumber}: ${p.remark}`);
            }
          }
        });
      }
    });

    res.json({
      teamNo,
      subjectId: team.subjectId,
      progress: team.progress,
      report: Object.values(studentReportMap)
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const PDFDocument = require('pdfkit');

// GET /report/:teamNo/pdf (Mentor/Admin)
const getTeamPdfReport = async (req, res) => {
  try {
    const { teamNo } = req.params;
    
    // Auth Check
    const team = await Team.findOne({ teamNo }).populate('members', 'name email');
    if (!team) return res.status(404).json({ message: 'Team not found' });

    if (req.user.role === 'Mentor' && team.mentor?.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const submissions = await Submission.find({ teamNo });

    // Aggregation maps
    const studentReportMap = {};
    team.members.forEach(m => {
      studentReportMap[m._id.toString()] = {
        name: m.name,
        email: m.email,
        totalMarks: 0,
        remarks: []
      };
    });

    submissions.forEach(sub => {
      if (sub.performance && Array.isArray(sub.performance)) {
        sub.performance.forEach(p => {
          const sId = p.studentId.toString();
          if (studentReportMap[sId]) {
            studentReportMap[sId].totalMarks += (p.marks || 0);
            if (p.remark) {
              studentReportMap[sId].remarks.push(`Phase ${sub.phaseNumber}: ${p.remark}`);
            }
          }
        });
      }
    });

    // Initialize PDFKit
    const doc = new PDFDocument({ margin: 50 });

    // Set Response Headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${teamNo}_Final_Report.pdf`);

    // Pipe the document to the res object
    doc.pipe(res);

    // Title
    doc.fontSize(24).font('Helvetica-Bold').text('PBL Project Final Report', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(16).font('Helvetica').text(`Team No: ${teamNo}`, { align: 'center' });
    doc.fontSize(12).text(`Overall Progress: ${team.progress}%`, { align: 'center' });
    doc.moveDown(2);

    // Iterate Students
    Object.values(studentReportMap).forEach(student => {
      doc.fontSize(16).font('Helvetica-Bold').text(student.name);
      doc.fontSize(10).font('Helvetica').text(student.email, { link: `mailto:${student.email}`, underline: true });
      doc.moveDown(0.5);
      
      doc.fontSize(12).font('Helvetica-Bold').text(`Total Grade: ${student.totalMarks} / 30`);
      doc.moveDown(0.5);
      
      doc.fontSize(12).font('Helvetica-Bold').text('Evaluations:');
      if (student.remarks.length > 0) {
        student.remarks.forEach(r => {
          doc.fontSize(10).font('Helvetica-Oblique').text(`- ${r}`);
        });
      } else {
        doc.fontSize(10).font('Helvetica-Oblique').text('No phase evaluations recorded.');
      }
      doc.moveDown(2);
    });

    // Finalize
    doc.end();

  } catch (err) {
    if (!res.headersSent) {
      res.status(500).json({ message: err.message });
    }
  }
};

module.exports = { submitPhase, gradeSubmission, getTeamSubmissions, getTeamReport, getTeamPdfReport };
