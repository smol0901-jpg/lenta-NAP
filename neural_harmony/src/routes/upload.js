/**
 * Routes загрузки файлов NEURAL_HARMONY
 * @author NEURAL_ARCHITECT_PREMIUM++
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { protect } = require('../middleware/auth');
const { AppError } = require('../middleware/errorHandler');

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath = './public/uploads/';
    
    switch(file.fieldname) {
      case 'photos':
        uploadPath += 'photos/';
        break;
      case 'videos':
        uploadPath += 'videos/';
        break;
      case 'audio':
        uploadPath += 'audio/';
        break;
      case 'drawings':
        uploadPath += 'drawings/';
        break;
      default:
        uploadPath += 'misc/';
    }
    
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp|mp4|webm|mov|mp3|wav|ogg|pdf|doc|docx|xls|xlsx/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  
  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new AppError('Invalid file type', 400));
  }
};

const upload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 104857600 // 100MB
  },
  fileFilter
});

// @route   POST /api/v1/upload/photos
// @desc    Загрузить фото
// @access  Private
router.post('/photos', protect, upload.array('photos', 10), async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return next(new AppError('No files uploaded', 400));
    }
    
    const files = req.files.map(file => ({
      url: `/uploads/photos/${file.filename}`,
      originalName: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
      uploadedAt: Date.now()
    }));
    
    res.json({
      success: true,
      message: 'Photos uploaded successfully',
      data: { files }
    });
  } catch (err) {
    next(err);
  }
});

// @route   POST /api/v1/upload/videos
// @desc    Загрузить видео
// @access  Private
router.post('/videos', protect, upload.array('videos', 5), async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return next(new AppError('No files uploaded', 400));
    }
    
    const files = req.files.map(file => ({
      url: `/uploads/videos/${file.filename}`,
      originalName: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
      uploadedAt: Date.now()
    }));
    
    res.json({
      success: true,
      message: 'Videos uploaded successfully',
      data: { files }
    });
  } catch (err) {
    next(err);
  }
});

// @route   POST /api/v1/upload/audio
// @desc    Загрузить аудио
// @access  Private
router.post('/audio', protect, upload.array('audio', 10), async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return next(new AppError('No files uploaded', 400));
    }
    
    const files = req.files.map(file => ({
      url: `/uploads/audio/${file.filename}`,
      originalName: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
      uploadedAt: Date.now()
    }));
    
    res.json({
      success: true,
      message: 'Audio files uploaded successfully',
      data: { files }
    });
  } catch (err) {
    next(err);
  }
});

// @route   POST /api/v1/upload/drawings
// @desc    Загрузить рисунок
// @access  Private
router.post('/drawings', protect, upload.array('drawings', 5), async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return next(new AppError('No files uploaded', 400));
    }
    
    const files = req.files.map(file => ({
      url: `/uploads/drawings/${file.filename}`,
      originalName: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
      uploadedAt: Date.now()
    }));
    
    res.json({
      success: true,
      message: 'Drawings uploaded successfully',
      data: { files }
    });
  } catch (err) {
    next(err);
  }
});

// @route   POST /api/v1/upload/multiple
// @desc    Загрузить разные типы файлов
// @access  Private
router.post('/multiple', protect, upload.fields([
  { name: 'photos', maxCount: 10 },
  { name: 'videos', maxCount: 5 },
  { name: 'audio', maxCount: 10 }
]), async (req, res, next) => {
  try {
    const result = {};
    
    if (req.files.photos) {
      result.photos = req.files.photos.map(file => ({
        url: `/uploads/photos/${file.filename}`,
        size: file.size
      }));
    }
    
    if (req.files.videos) {
      result.videos = req.files.videos.map(file => ({
        url: `/uploads/videos/${file.filename}`,
        size: file.size
      }));
    }
    
    if (req.files.audio) {
      result.audio = req.files.audio.map(file => ({
        url: `/uploads/audio/${file.filename}`,
        size: file.size
      }));
    }
    
    res.json({
      success: true,
      message: 'Files uploaded successfully',
      data: { files: result }
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
