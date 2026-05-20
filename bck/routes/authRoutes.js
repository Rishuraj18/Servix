const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,
  loginAdmin,
  registerAdmin,
  loginUnified,
  getMe
} = require('../controllers/authController');
const { protect } = require('../middlewares/auth');

router.post('/register/user', registerUser);
router.post('/register/admin', registerAdmin);

router.post('/login', loginUnified);
router.post('/login/user', loginUnified); // Route backward compatibility
router.post('/login/admin', loginUnified); // Route backward compatibility

router.get('/me', protect, getMe);

module.exports = router;
