const express = require('express');
const router = express.Router();
const { getActivePhase, setActivePhase } = require('../controllers/phaseController');
const { protect } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/roleMiddleware');

router.get('/', protect, getActivePhase);
router.put('/', protect, authorize('Admin'), setActivePhase);

module.exports = router;
