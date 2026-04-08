const express = require('express');
const router = express.Router();
const { submitPhase, gradeSubmission, getTeamSubmissions, getTeamReport, getTeamPdfReport } = require('../controllers/submissionController');
const { protect } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/roleMiddleware');
const upload = require('../middleware/upload');

router.post('/submit', protect, authorize('Student'), upload.single('synopsis'), submitPhase);
router.post('/grade/:id', protect, authorize('Mentor', 'Admin'), gradeSubmission);
router.get('/report/:teamNo/pdf', protect, authorize('Mentor', 'Admin'), getTeamPdfReport);
router.get('/report/:teamNo', protect, authorize('Mentor', 'Admin'), getTeamReport);
router.get('/:teamNo', protect, getTeamSubmissions);

module.exports = router;
