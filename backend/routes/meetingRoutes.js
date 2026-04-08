const express = require('express');
const router = express.Router();
const { getMeetings, requestMeeting, updateMeetingStatus } = require('../controllers/meetingController');
const { protect } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/roleMiddleware');

router.get('/', protect, getMeetings);
router.post('/', protect, authorize('Student'), requestMeeting);
router.put('/:id/status', protect, authorize('Mentor', 'Admin'), updateMeetingStatus);

module.exports = router;
