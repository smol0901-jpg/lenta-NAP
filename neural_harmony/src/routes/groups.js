/**
 * Routes групп NEURAL_HARMONY
 * @author NEURAL_ARCHITECT_PREMIUM++
 */

const express = require('express');
const router = express.Router();
const Group = require('../models/Group');
const { protect } = require('../middleware/auth');
const { AppError } = require('../middleware/errorHandler');

// @route   GET /api/v1/groups
// @desc    Получить все группы
// @access  Private
router.get('/', protect, async (req, res, next) => {
  try {
    const { page = 1, limit = 20, type, category } = req.query;
    
    const query = { isActive: true };
    
    if (type) query.type = type;
    if (category) query.category = category;
    
    // Only show public and closed groups user is member of
    if (req.user.role === 'employee') {
      query.$or = [
        { type: 'public' },
        { 
          type: 'closed',
          'members.user': req.user.id
        }
      ];
    }
    
    const groups = await Group.find(query)
      .populate('admins.user', 'firstName lastName avatar')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });
    
    const count = await Group.countDocuments(query);
    
    res.json({
      success: true,
      data: { groups },
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

// @route   POST /api/v1/groups
// @desc    Создать новую группу
// @access  Private
router.post('/', protect, async (req, res, next) => {
  try {
    const { name, description, type, category, avatar, coverImage } = req.body;
    
    const group = await Group.create({
      name,
      description,
      type: type || 'public',
      category: category || 'other',
      avatar,
      coverImage,
      admins: [{
        user: req.user.id,
        role: 'creator',
        permissions: ['all']
      }],
      members: [{
        user: req.user.id,
        role: 'member',
        status: 'active'
      }]
    });
    
    const populatedGroup = await Group.findById(group._id)
      .populate('admins.user', 'firstName lastName avatar position');
    
    res.status(201).json({
      success: true,
      message: 'Group created successfully',
      data: { group: populatedGroup }
    });
  } catch (err) {
    next(err);
  }
});

// @route   GET /api/v1/groups/:id
// @desc    Получить группу по ID
// @access  Private
router.get('/:id', protect, async (req, res, next) => {
  try {
    const group = await Group.findById(req.params.id)
      .populate('admins.user', 'firstName lastName avatar position department')
      .populate('members.user', 'firstName lastName avatar position');
    
    if (!group) {
      return next(new AppError('Group not found', 404));
    }
    
    // Check access
    if (group.type === 'secret' && !group.isMember(req.user.id)) {
      return next(new AppError('Not authorized to view this group', 403));
    }
    
    res.json({
      success: true,
      data: { group }
    });
  } catch (err) {
    next(err);
  }
});

// @route   PUT /api/v1/groups/:id
// @desc    Обновить группу
// @access  Private (Admin only)
router.put('/:id', protect, async (req, res, next) => {
  try {
    const group = await Group.findById(req.params.id);
    
    if (!group) {
      return next(new AppError('Group not found', 404));
    }
    
    if (!group.isAdmin(req.user.id)) {
      return next(new AppError('Not authorized to update this group', 403));
    }
    
    const allowedFields = ['name', 'description', 'avatar', 'coverImage', 'settings'];
    const updates = {};
    
    Object.keys(req.body).forEach(key => {
      if (allowedFields.includes(key)) {
        updates[key] = req.body[key];
      }
    });
    
    const updatedGroup = await Group.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true }
    ).populate('admins.user', 'firstName lastName avatar');
    
    res.json({
      success: true,
      message: 'Group updated successfully',
      data: { group: updatedGroup }
    });
  } catch (err) {
    next(err);
  }
});

// @route   DELETE /api/v1/groups/:id
// @desc    Удалить группу
// @access  Private (Creator only)
router.delete('/:id', protect, async (req, res, next) => {
  try {
    const group = await Group.findById(req.params.id);
    
    if (!group) {
      return next(new AppError('Group not found', 404));
    }
    
    const creator = group.admins.find(a => a.role === 'creator');
    if (creator.user.toString() !== req.user.id) {
      return next(new AppError('Only creator can delete this group', 403));
    }
    
    group.isActive = false;
    await group.save();
    
    res.json({
      success: true,
      message: 'Group deleted successfully'
    });
  } catch (err) {
    next(err);
  }
});

// @route   POST /api/v1/groups/:id/join
// @desc    Вступить в группу
// @access  Private
router.post('/:id/join', protect, async (req, res, next) => {
  try {
    const group = await Group.findById(req.params.id);
    
    if (!group) {
      return next(new AppError('Group not found', 404));
    }
    
    if (group.isMember(req.user.id)) {
      return next(new AppError('Already a member', 400));
    }
    
    if (group.type === 'secret') {
      return next(new AppError('Cannot join secret group without invite', 403));
    }
    
    if (group.type === 'closed') {
      // Add as pending
      group.addMember(req.user.id, 'member');
      const memberIndex = group.members.findIndex(m => m.user.toString() === req.user.id);
      group.members[memberIndex].status = 'pending';
      await group.save();
      
      return res.json({
        success: true,
        message: 'Join request sent, waiting for approval'
      });
    }
    
    group.addMember(req.user.id);
    await group.save();
    
    res.json({
      success: true,
      message: 'Joined group successfully'
    });
  } catch (err) {
    next(err);
  }
});

// @route   POST /api/v1/groups/:id/leave
// @desc    Покинуть группу
// @access  Private
router.post('/:id/leave', protect, async (req, res, next) => {
  try {
    const group = await Group.findById(req.params.id);
    
    if (!group) {
      return next(new AppError('Group not found', 404));
    }
    
    group.removeMember(req.user.id);
    await group.save();
    
    res.json({
      success: true,
      message: 'Left group successfully'
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
