const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { UserAccount, Staff, AuditLog } = require('../models');
const { v4: uuidv4 } = require('uuid');

// Login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: 'Username and password are required'
      });
    }

    // Find user
    const user = await UserAccount.findOne({ username: username.toLowerCase() });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // Get staff details if applicable
    let staffDetails = null;
    if (user.staff_id) {
      staffDetails = await Staff.findOne({ staff_id: user.staff_id });
    }

    // Create JWT token
    const token = jwt.sign(
      { 
        user_id: user.user_id, 
        username: user.username, 
        role: user.role 
      },
      process.env.JWT_SECRET || 'your_jwt_secret',
      { expiresIn: '24h' }
    );

    // Create audit log
    await AuditLog.create({
      audit_id: `AUD${uuidv4()}`,
      user_id: user.user_id,
      action: 'login',
      details: `User ${username} logged in successfully`
    });

    res.json({
      success: true,
      data: {
        token,
        user: {
          user_id: user.user_id,
          username: user.username,
          role: user.role,
          staff_id: user.staff_id,
          staff_details: staffDetails
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Register (for patient self-registration)
router.post('/register', async (req, res) => {
  try {
    const { username, password, role } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: 'Username and password are required'
      });
    }

    // Check if user already exists
    const existingUser = await UserAccount.findOne({ username: username.toLowerCase() });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'Username already exists'
      });
    }

    // Generate user ID
    const userCount = await UserAccount.countDocuments();
    const user_id = `USER${String(userCount + 1).padStart(5, '0')}`;

    // Create user
    const user = await UserAccount.create({
      user_id,
      username: username.toLowerCase(),
      password_hash: password, // Will be hashed by pre-save hook
      role: role || 'Patient'
    });

    // Create JWT token
    const token = jwt.sign(
      { 
        user_id: user.user_id, 
        username: user.username, 
        role: user.role 
      },
      process.env.JWT_SECRET || 'your_jwt_secret',
      { expiresIn: '24h' }
    );

    res.status(201).json({
      success: true,
      data: {
        token,
        user: {
          user_id: user.user_id,
          username: user.username,
          role: user.role
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Verify token middleware
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'No token provided'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: 'Invalid token'
    });
  }
};

// Get current user
router.get('/me', verifyToken, async (req, res) => {
  try {
    const user = await UserAccount.findOne({ user_id: req.user.user_id })
      .select('-password_hash');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Get staff details if applicable
    let staffDetails = null;
    if (user.staff_id) {
      staffDetails = await Staff.findOne({ staff_id: user.staff_id });
    }

    res.json({
      success: true,
      data: {
        ...user.toObject(),
        staff_details: staffDetails
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Logout (for audit purposes)
router.post('/logout', verifyToken, async (req, res) => {
  try {
    // Create audit log
    await AuditLog.create({
      audit_id: `AUD${uuidv4()}`,
      user_id: req.user.user_id,
      action: 'logout',
      details: `User ${req.user.username} logged out`
    });

    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
module.exports.verifyToken = verifyToken;
