const express = require('express');
const router = express.Router();
const { getProfile, updateProfile } = require('../controllers/profileController');
const { protect } = require('../middlewares/authMiddleware');

router.get('/me', protect, getProfile);
router.put('/update', protect, updateProfile);

module.exports = router;
