/**
 * Middleware аутентификации NEURAL_HARMONY
 * @author NEURAL_ARCHITECT_PREMIUM++
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { AppError } = require('./errorHandler');

// Protect routes
exports.protect = async (req, res, next) => {
  let token;
  
  // Check for token in headers
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }
  
  // Make sure there is a token
  if (!token) {
    return next(new AppError('Not authorized to access this route', 401));
  }
  
  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from token
    req.user = await User.findById(decoded.id);
    
    if (!req.user) {
      return next(new AppError('User not found', 404));
    }
    
    // Check if user is banned
    if (req.user.role === 'banned') {
      return next(new AppError('User account is banned', 403));
    }
    
    next();
  } catch (err) {
    return next(new AppError('Not authorized to access this route', 401));
  }
};

// Authorize specific roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError(`Role ${req.user.role} is not authorized to access this route`, 403)
      );
    }
    next();
  };
};

// Check permissions
exports.checkPermission = (resource, action) => {
  return (req, res, next) => {
    const userPermissions = req.user.permissions || [];
    const hasPermission = userPermissions.some(
      perm => perm.resource === resource && perm.actions.includes(action)
    );
    
    if (!hasPermission && req.user.role !== 'super-admin') {
      return next(
        new AppError(`No permission to ${action} ${resource}`, 403)
      );
    }
    next();
  };
};

// Rate limit by user
exports.rateLimitByUser = (maxRequests, windowMs) => {
  const requests = new Map();
  
  return (req, res, next) => {
    if (!req.user) return next();
    
    const userId = req.user._id.toString();
    const now = Date.now();
    
    if (!requests.has(userId)) {
      requests.set(userId, { count: 1, startTime: now });
      return next();
    }
    
    const userData = requests.get(userId);
    
    if (now - userData.startTime > windowMs) {
      userData.count = 1;
      userData.startTime = now;
      return next();
    }
    
    if (userData.count >= maxRequests) {
      return next(new AppError('Too many requests, please try again later', 429));
    }
    
    userData.count++;
    next();
  };
};

module.exports = exports;
