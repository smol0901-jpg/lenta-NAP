/**
 * Routes аутентификации NEURAL_HARMONY
 * @author NEURAL_ARCHITECT_PREMIUM++
 */

const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const { AppError } = require('../middleware/errorHandler');

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '24h'
  });
};

// @route   POST /api/v1/auth/register
// @desc    Регистрация нового пользователя
// @access  Public
router.post('/register', async (req, res, next) => {
  try {
    const { email, password, firstName, lastName, phone, position, department } = req.body;
    
    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return next(new AppError('User already exists with this email', 400));
    }
    
    // Create user
    const user = await User.create({
      email,
      password,
      firstName,
      lastName,
      middleName: req.body.middleName,
      phone,
      position,
      department,
      role: req.body.role || 'employee'
    });
    
    // Generate token
    const token = generateToken(user._id);
    
    res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: {
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          avatar: user.avatar,
          role: user.role
        },
        token
      }
    });
  } catch (err) {
    next(err);
  }
});

// @route   POST /api/v1/auth/login
// @desc    Вход пользователя
// @access  Public
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    
    // Validate input
    if (!email || !password) {
      return next(new AppError('Please provide email and password', 400));
    }
    
    // Find user with password
    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      return next(new AppError('Invalid credentials', 401));
    }
    
    // Check if user is banned
    if (user.role === 'banned') {
      return next(new AppError('Account is banned', 403));
    }
    
    // Check password
    const isMatch = await user.comparePassword(password);
    
    if (!isMatch) {
      return next(new AppError('Invalid credentials', 401));
    }
    
    // Update last login
    user.lastLogin = Date.now();
    user.online = true;
    await user.save();
    
    // Generate token
    const token = generateToken(user._id);
    
    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          avatar: user.avatar,
          role: user.role,
          position: user.position,
          department: user.department
        },
        token
      }
    });
  } catch (err) {
    next(err);
  }
});

// @route   GET /api/v1/auth/me
// @desc    Получить текущего пользователя
// @access  Private
router.get('/me', protect, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    
    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          middleName: user.middleName,
          avatar: user.avatar,
          coverImage: user.coverImage,
          bio: user.bio,
          position: user.position,
          department: user.department,
          role: user.role,
          status: user.status,
          skills: user.skills,
          contacts: user.contacts,
          settings: user.settings,
          createdAt: user.createdAt
        }
      }
    });
  } catch (err) {
    next(err);
  }
});

// @route   PUT /api/v1/auth/updateprofile
// @desc    Обновление профиля
// @access  Private
router.put('/updateprofile', protect, async (req, res, next) => {
  try {
    const allowedFields = ['firstName', 'lastName', 'middleName', 'bio', 'avatar', 'coverImage', 'phone', 'contacts', 'skills'];
    const updates = {};
    
    Object.keys(req.body).forEach(key => {
      if (allowedFields.includes(key)) {
        updates[key] = req.body[key];
      }
    });
    
    const user = await User.findByIdAndUpdate(
      req.user.id,
      updates,
      { new: true, runValidators: true }
    );
    
    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: { user }
    });
  } catch (err) {
    next(err);
  }
});

// @route   POST /api/v1/auth/logout
// @desc    Выход пользователя
// @access  Private
router.post('/logout', protect, async (req, res, next) => {
  try {
    await User.findByIdAndUpdate(req.user.id, {
      online: false,
      lastSeen: Date.now()
    });
    
    res.json({
      success: true,
      message: 'Logout successful'
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
