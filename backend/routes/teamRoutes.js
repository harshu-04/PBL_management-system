const express = require('express');
const router = express.Router();
const { getTeams, getTeamByNo, createTeam, joinTeam, deleteTeam } = require('../controllers/teamController');
const { protect } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/roleMiddleware');

router.get('/', protect, getTeams);
router.get('/:teamNo', protect, getTeamByNo);
router.post('/create', protect, createTeam);
router.post('/join', protect, joinTeam);
router.delete('/:id', protect, authorize('Admin'), deleteTeam);

module.exports = router;
