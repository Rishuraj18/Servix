const bcrypt = require('bcrypt');
const db = require('../config/db');
const { generateToken } = require('../utils/jwt');

// @desc    Register a new user
// @route   POST /api/auth/register/user
// @access  Public
const registerUser = async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    if (!name || !email || !phone || !password) {
      return res.status(400).json({ success: false, message: 'Please provide all required fields' });
    }

    const [existingUsers] = await db.query('SELECT * FROM users WHERE email = ? OR phone = ?', [email, phone]);
    if (existingUsers.length > 0) {
      return res.status(400).json({ success: false, message: 'User with this email or phone already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const [result] = await db.query(
      'INSERT INTO users (name, email, phone, password) VALUES (?, ?, ?, ?)',
      [name, email, phone, hashedPassword]
    );

    const token = generateToken(result.insertId, 'user');

    res.status(201).json({
      success: true,
      token,
      user: { id: result.insertId, name, email, phone, role: 'user' }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Register a new admin
// @route   POST /api/auth/register/admin
// @access  Public
const registerAdmin = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide all required fields' });
    }

    const [existingAdmins] = await db.query('SELECT * FROM admins WHERE email = ?', [email]);
    if (existingAdmins.length > 0) {
      return res.status(400).json({ success: false, message: 'Admin account with this email already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const [result] = await db.query(
      'INSERT INTO admins (name, email, password, role) VALUES (?, ?, ?, ?)',
      [name, email, hashedPassword, 'superadmin']
    );

    const token = generateToken(result.insertId, 'admin');

    res.status(201).json({
      success: true,
      token,
      user: { id: result.insertId, name, email, role: 'admin', adminRole: 'superadmin' }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Login a user or admin dynamically (Unified Role-Based Login)
// @route   POST /api/auth/login
// @access  Public
const loginUnified = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    // 1. Check in users (Customers) table first
    const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length > 0) {
      const user = users[0];
      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
      }

      if (user.status === 'blocked') {
        return res.status(403).json({ success: false, message: 'Your account has been blocked' });
      }

      const token = generateToken(user.id, 'user');

      return res.json({
        success: true,
        token,
        user: { id: user.id, name: user.name, email: user.email, phone: user.phone, role: 'user' }
      });
    }

    // 2. Check in admins table next
    const [admins] = await db.query('SELECT * FROM admins WHERE email = ?', [email]);
    if (admins.length > 0) {
      const admin = admins[0];
      const isMatch = await bcrypt.compare(password, admin.password);

      if (!isMatch) {
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
      }

      const token = generateToken(admin.id, 'admin');

      return res.json({
        success: true,
        token,
        user: { id: admin.id, name: admin.name, email: admin.email, role: 'admin', adminRole: admin.role }
      });
    }

    // 3. Email did not match in either users or admins
    return res.status(401).json({ success: false, message: 'Invalid credentials' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// Compatibility fallbacks for legacy code calling deprecated separate routes
const loginUser = loginUnified;
const loginAdmin = loginUnified;

// @desc    Get Current Logged in User/Admin
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    let query;
    const role = req.user.role;

    if (role === 'user') {
      query = 'SELECT id, name, email, phone, profile_image, address, status FROM users WHERE id = ?';
    } else if (role === 'admin') {
      query = 'SELECT id, name, email, role AS adminRole FROM admins WHERE id = ?';
    } else {
      return res.status(400).json({ success: false, message: 'Invalid role' });
    }

    const [rows] = await db.query(query, [req.user.id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    let data = { ...rows[0], role };

    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

module.exports = {
  registerUser,
  registerAdmin,
  loginUser,
  loginAdmin,
  loginUnified,
  getMe
};
