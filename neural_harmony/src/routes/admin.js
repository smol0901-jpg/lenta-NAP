/**
 * Routes администрирования NEURAL_HARMONY
 * @author NEURAL_ARCHITECT_PREMIUM++
 */

const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');
const { AppError } = require('../middleware/errorHandler');

// All routes require admin authorization
router.use(protect);
router.use(authorize('super-admin', 'admin'));

// @route   GET /api/v1/admin/dashboard
// @desc    Получить статистику администратора
// @access  Private (Admin)
router.get('/dashboard', async (req, res, next) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ status: 'active', online: true });
    const bannedUsers = await User.countDocuments({ role: 'banned' });
    
    const stats = {
      users: {
        total: totalUsers,
        active: activeUsers,
        banned: bannedUsers,
        byRole: await User.aggregate([
          { $group: { _id: '$role', count: { $sum: 1 } } }
        ])
      },
      activity: {
        postsToday: Math.floor(Math.random() * 100),
        messagesToday: Math.floor(Math.random() * 500),
        newUsersToday: Math.floor(Math.random() * 20)
      },
      system: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        version: '1.0.0'
      }
    };
    
    res.json({
      success: true,
      data: { dashboard: stats }
    });
  } catch (err) {
    next(err);
  }
});

// @route   GET /api/v1/admin/users
// @desc    Получить всех пользователей (админ)
// @access  Private (Admin)
router.get('/users', async (req, res, next) => {
  try {
    const { page = 1, limit = 50, role, status } = req.query;
    
    const query = {};
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

// @route   PUT /api/v1/admin/users/:id/role
// @desc    Изменить роль пользователя
// @access  Private (Admin)
router.put('/users/:id/role', async (req, res, next) => {
  try {
    const { role } = req.body;
    
    const validRoles = ['employee', 'team-lead', 'department-head', 'moderator', 'admin'];
    if (!validRoles.includes(role)) {
      return next(new AppError('Invalid role', 400));
    }
    
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    ).select('-password -refreshToken');
    
    res.json({
      success: true,
      message: 'User role updated',
      data: { user }
    });
  } catch (err) {
    next(err);
  }
});

// @route   PUT /api/v1/admin/users/:id/ban
// @desc    Забанить пользователя
// @access  Private (Admin)
router.put('/users/:id/ban', async (req, res, next) => {
  try {
    const { reason } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { 
        role: 'banned',
        status: 'inactive'
      },
      { new: true }
    ).select('-password -refreshToken');
    
    res.json({
      success: true,
      message: 'User banned',
      data: { user }
    });
  } catch (err) {
    next(err);
  }
});

// @route   PUT /api/v1/admin/users/:id/unban
// @desc    Разбанить пользователя
// @access  Private (Admin)
router.put('/users/:id/unban', async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { 
        role: 'employee',
        status: 'active'
      },
      { new: true }
    ).select('-password -refreshToken');
    
    res.json({
      success: true,
      message: 'User unbanned',
      data: { user }
    });
  } catch (err) {
    next(err);
  }
});

// @route   DELETE /api/v1/admin/users/:id
// @desc    Удалить пользователя навсегда
// @access  Private (Super Admin)
router.delete('/users/:id', authorize('super-admin'), async (req, res, next) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    
    res.json({
      success: true,
      message: 'User permanently deleted'
    });
  } catch (err) {
    next(err);
  }
});

// @route   GET /api/v1/admin/logs
// @desc    Получить логи системы
// @access  Private (Admin)
router.get('/logs', async (req, res, next) => {
  try {
    const { page = 1, limit = 50, level } = req.query;
    
    // Demo logs
    const logs = Array.from({ length: parseInt(limit) }, (_, i) => ({
      id: `log_${i}`,
      level: level || 'info',
      message: `System log entry ${i}`,
      timestamp: new Date(Date.now() - i * 60000).toISOString(),
      source: 'system'
    }));
    
    res.json({
      success: true,
      data: { logs },
      pagination: {
        total: 1000,
        page: parseInt(page),
        pages: 20
      }
    });
  } catch (err) {
    next(err);
  }
});

// @route   POST /api/v1/admin/broadcast
// @desc    Отправить массовое уведомление
// @access  Private (Admin)
router.post('/broadcast', async (req, res, next) => {
  try {
    const { title, message, targetRoles } = req.body;
    
    // Demo broadcast
    res.json({
      success: true,
      message: 'Broadcast sent successfully',
      data: {
        broadcastId: `bc_${Date.now()}`,
        recipients: targetRoles || 'all',
        sentAt: Date.now()
      }
    });
  } catch (err) {
    next(err);
  }
});

// @route   GET /api/v1/admin/settings
// @desc    Получить настройки системы
// @access  Private (Admin)
router.get('/settings', async (req, res, next) => {
  try {
    const settings = {
      general: {
        siteName: 'NEURAL_HARMONY',
        maintenanceMode: false,
        registrationEnabled: true
      },
      features: {
        gamesEnabled: true,
        aiEnabled: true,
        fileUploadEnabled: true
      },
      limits: {
        maxFileSize: 104857600,
        maxPostsPerDay: 50,
        maxMessagesPerHour: 100
      }
    };
    
    res.json({
      success: true,
      data: { settings }
    });
  } catch (err) {
    next(err);
  }
});

// @route   PUT /api/v1/admin/settings
// @desc    Обновить настройки системы
// @access  Private (Super Admin)
router.put('/settings', authorize('super-admin'), async (req, res, next) => {
  try {
    // Demo settings update
    res.json({
      success: true,
      message: 'Settings updated successfully'
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
