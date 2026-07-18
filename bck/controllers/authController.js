const bcrypt = require('bcrypt');
const User = require('../models/User');
const Admin = require('../models/Admin');
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

    const existingUsers = await User.find({ $or: [{ email }, { phone }] });
    if (existingUsers.length > 0) {
      return res.status(400).json({ success: false, message: 'User with this email or phone already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      name,
      email,
      phone,
      password: hashedPassword
    });
    
    await newUser.save();

    const token = generateToken(newUser._id, 'user');

    res.status(201).json({
      success: true,
      token,
      user: { id: newUser._id, name, email, phone, role: 'user' }
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

    // 1. Check in users (Customers) collection first
    const users = await User.find({ email });
    if (users.length > 0) {
      const user = users[0];
      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
      }

      if (user.status === 'blocked') {
        return res.status(403).json({ success: false, message: 'Your account has been blocked' });
      }

      const token = generateToken(user._id, 'user');

      return res.json({
        success: true,
        token,
        user: { id: user._id, name: user.name, email: user.email, phone: user.phone, role: 'user' }
      });
    }

    // 2. Check in admins collection next
    const admins = await Admin.find({ email });
    if (admins.length > 0) {
      const admin = admins[0];
      const isMatch = await bcrypt.compare(password, admin.password);

      if (!isMatch) {
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
      }

      const token = generateToken(admin._id, 'admin');

      return res.json({
        success: true,
        token,
        user: { id: admin._id, name: admin.name, email: admin.email, role: 'admin', adminRole: admin.role }
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
    const role = req.user.role;
    let data;

    if (role === 'user') {
      const user = await User.findById(req.user.id).select('id name email phone profile_image address status');
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }
      data = { ...user.toJSON(), role };
    } else if (role === 'admin') {
      const admin = await Admin.findById(req.user.id).select('id name email role');
      if (!admin) {
        return res.status(404).json({ success: false, message: 'Admin not found' });
      }
      // Need to map role to adminRole based on original sql output
      const adminData = admin.toJSON();
      data = { 
        id: adminData.id, 
        name: adminData.name, 
        email: adminData.email, 
        adminRole: adminData.role, 
        role 
      };
    } else {
      return res.status(400).json({ success: false, message: 'Invalid role' });
    }

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
  loginUser,
  loginAdmin,
  loginUnified,
  getMe
};
