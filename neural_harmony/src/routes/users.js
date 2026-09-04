/**
 * Routes пользователей NEURAL_HARMONY
 * @author NEURAL_ARCHITECT_PREMIUM++
 */

const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');
const { AppError } = require('../middleware/errorHandler');

// @route   GET /api/v1/users
// @desc    Получить всех пользователей
// @access  Private (HR, Admin)
router.get('/', protect, authorize('super-admin', 'admin', 'hr-manager'), async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search, department, position, role, status } = req.query;
    
    const query = {};
    
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { position: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (department) query.department = department;
    if (position) query.position = position;
    if (role) query.role = role;
    if (status) query.status = status;
    
    const users = await User.find(query)
      .select('-password -refreshToken')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });
    
    const count = await User.countDocuments(query);
    
    res.json({
      success: true,
      data: { users },
      pagination: {
        total: count,
        page: parseInt(page),
        pages: Math.ceil(count / limit)
      }
    });
  } catch (err) {
    next(err);
  }
});

// @route   GET /api/v1/users/:id
// @desc    Получить пользователя по ID
// @access  Public (с учётом приватности)
router.get('/:id', async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password -refreshToken -resetPasswordToken');
    
    if (!user) {
      return next(new AppError('User not found', 404));
    }
    
    // Check privacy settings
    if (user.privacy.profileVisibility === 'private') {
      // Only show basic info
      return res.json({
        success: true,
        data: {
          user: {
            id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            avatar: user.avatar,
            position: user.position,
            department: user.department
          }
        }
      });
    }
    
    res.json({
      success: true,
      data: { user }
    });
  } catch (err) {
    next(err);
  }
});

// @route   PUT /api/v1/users/:id
// @desc    Обновить пользователя
// @access  Private (Admin или сам пользователь)
router.put('/:id', protect, async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return next(new AppError('User not found', 404));
    }
    
    // Check permission
    if (req.user.id !== user._id.toString() && 
        !['super-admin', 'admin', 'hr-manager'].includes(req.user.role)) {
      return next(new AppError('Not authorized to update this user', 403));
    }
    
    const allowedFields = ['firstName', 'lastName', 'middleName', 'bio', 'avatar', 
                          'coverImage', 'phone', 'position', 'department', 'skills',
                          'contacts', 'status', 'privacy', 'settings'];
    
    const updates = {};
    Object.keys(req.body).forEach(key => {
      if (allowedFields.includes(key)) {
        updates[key] = req.body[key];
      }
    });
    
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).select('-password -refreshToken');
    
    res.json({
      success: true,
      message: 'User updated successfully',
      data: { user: updatedUser }
    });
  } catch (err) {
    next(err);
  }
});

// @route   DELETE /api/v1/users/:id
// @desc    Удалить пользователя
// @access  Private (Admin only)
router.delete('/:id', protect, authorize('super-admin', 'admin'), async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return next(new AppError('User not found', 404));
    }
    
    // Soft delete - set to inactive
    user.status = 'inactive';
    await user.save();
    
    res.json({
      success: true,
      message: 'User deactivated successfully'
    });
  } catch (err) {
    next(err);
  }
});

// @route   POST /api/v1/users/:id/friend-request
// @desc    Отправить запрос в друзья
// @access  Private
router.post('/:id/friend-request', protect, async (req, res, next) => {
  try {
    const targetUser = await User.findById(req.params.id);
    
    if (!targetUser) {
      return next(new AppError('User not found', 404));
    }
    
    if (req.user.id === targetUser._id.toString()) {
      return next(new AppError('Cannot send friend request to yourself', 400));
    }
    
    // Check if already friends
    const existingFriend = targetUser.friends.find(
      f => f.user.toString() === req.user.id
    );
    
    if (existingFriend) {
      return next(new AppError('Friend request already exists', 400));
    }
    
    targetUser.friends.push({
      user: req.user.id,
      status: 'pending'
    });
    
    await targetUser.save();
    
    res.json({
      success: true,
      message: 'Friend request sent'
    });
  } catch (err) {
    next(err);
  }
});

// @route   PUT /api/v1/users/friends/:friendId/accept
// @desc    Принять запрос в друзья
// @access  Private
router.put('/friends/:friendId/accept', protect, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    const friendIndex = user.friends.findIndex(
      f => f.user.toString() === req.params.friendId
    );
    
    if (friendIndex === -1) {
      return next(new AppError('Friend request not found', 404));
    }
    
    user.friends[friendIndex].status = 'accepted';
    await user.save();
    
    // Add reciprocal friendship
    const friend = await User.findById(req.params.friendId);
    friend.friends.push({
      user: req.user.id,
      status: 'accepted'
    });
    await friend.save();
    
    res.json({
      success: true,
      message: 'Friend request accepted'
    });
  } catch (err) {
    next(err);
  }
});

// @route   GET /api/v1/users/search
// @desc    Поиск пользователей
// @access  Private
router.get('/search', protect, async (req, res, next) => {
  try {
    const { q, limit = 10 } = req.query;
    
    const users = await User.find({
      $or: [
        { firstName: { $regex: q, $options: 'i' } },
        { lastName: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } }
      ]
    })
    .select('firstName lastName avatar position department')
    .limit(parseInt(limit));
    
    res.json({
      success: true,
      data: { users }
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
