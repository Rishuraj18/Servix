const express = require('express');
const router = express.Router();
const { getServices, createService, updateService } = require('../controllers/serviceController');
const { protect, authorize } = require('../middlewares/auth');

router.route('/')
  .get(getServices)
  .post(protect, authorize('admin'), createService);

router.route('/:id')
  .put(protect, authorize('admin'), updateService);

module.exports = router;
