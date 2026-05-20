const express = require('express');
const router = express.Router();
const { getDashboard } = require('../controllers/adminController');
const { protect, authorize } = require('../middlewares/auth');

router.get('/dashboard', protect, authorize('admin'), getDashboard);

module.exports = router;
