const express = require('express');
const router = express.Router();
const { getSubjects, createSubject } = require('../controllers/subjectController');
const { protect } = require('../middlewares/authMiddleware');

router.route('/')
  .get(protect, getSubjects)
  .post(protect, createSubject);

module.exports = router;
