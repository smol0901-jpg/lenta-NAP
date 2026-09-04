/**
 * Routes постов NEURAL_HARMONY
 * @author NEURAL_ARCHITECT_PREMIUM++
 */

const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const { AppError } = require('../middleware/errorHandler');

// @route   GET /api/v1/posts
// @desc    Получить ленту постов
// @access  Private
router.get('/', protect, async (req, res, next) => {
  try {
    const { page = 1, limit = 20, type, hashtag } = req.query;
    
    const query = { status: 'published' };
    
    if (type) query.type = type;
    if (hashtag) query.hashtags = hashtag;
    
    // Get posts from user's friends and public posts
    const user = await User.findById(req.user.id);
    const friendIds = user.friends
      .filter(f => f.status === 'accepted')
      .map(f => f.user);
    
    query.$or = [
      { visibility: 'public' },
      { author: { $in: friendIds } }
    ];
    
    const posts = await Post.find(query)
      .populate('author', 'firstName lastName avatar position department')
      .populate('comments.author', 'firstName lastName avatar')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ isPinned: -1, createdAt: -1 });
    
    const count = await Post.countDocuments(query);
    
    res.json({
      success: true,
      data: { posts },
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

// @route   POST /api/v1/posts
// @desc    Создать новый пост
// @access  Private
router.post('/', protect, async (req, res, next) => {
  try {
    const { content, title, images, videos, audio, documents, type, poll, visibility, group } = req.body;
    
    const post = await Post.create({
      author: req.user.id,
      content,
      title,
      images,
      videos,
      audio,
      documents,
      type: type || 'text',
      poll,
      visibility: visibility || 'public',
      group
    });
    
    // Update user posts count
    await User.findByIdAndUpdate(req.user.id, {
      $inc: { postsCount: 1 }
    });
    
    const populatedPost = await Post.findById(post._id)
      .populate('author', 'firstName lastName avatar position department');
    
    res.status(201).json({
      success: true,
      message: 'Post created successfully',
      data: { post: populatedPost }
    });
  } catch (err) {
    next(err);
  }
});

// @route   GET /api/v1/posts/:id
// @desc    Получить пост по ID
// @access  Public
router.get('/:id', async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('author', 'firstName lastName avatar position department')
      .populate('likes.user', 'firstName lastName avatar')
      .populate('reactions.user', 'firstName lastName avatar');
    
    if (!post) {
      return next(new AppError('Post not found', 404));
    }
    
    // Increment views
    post.viewsCount++;
    await post.save();
    
    res.json({
      success: true,
      data: { post }
    });
  } catch (err) {
    next(err);
  }
});

// @route   PUT /api/v1/posts/:id
// @desc    Обновить пост
// @access  Private (автор или админ)
router.put('/:id', protect, async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    
    if (!post) {
      return next(new AppError('Post not found', 404));
    }
    
    if (post.author.toString() !== req.user.id && 
        !['super-admin', 'admin', 'moderator'].includes(req.user.role)) {
      return next(new AppError('Not authorized to update this post', 403));
    }
    
    const allowedFields = ['content', 'title', 'images', 'videos', 'audio', 'visibility'];
    const updates = {};
    
    Object.keys(req.body).forEach(key => {
      if (allowedFields.includes(key)) {
        updates[key] = req.body[key];
      }
    });
    
    updates.isEdited = true;
    updates.editHistory = updates.editHistory || [];
    updates.editHistory.push({
      content: post.content,
      editedAt: Date.now(),
      editor: req.user.id
    });
    
    const updatedPost = await Post.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true }
    ).populate('author', 'firstName lastName avatar');
    
    res.json({
      success: true,
      message: 'Post updated successfully',
      data: { post: updatedPost }
    });
  } catch (err) {
    next(err);
  }
});

// @route   DELETE /api/v1/posts/:id
// @desc    Удалить пост
// @access  Private (автор или админ)
router.delete('/:id', protect, async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    
    if (!post) {
      return next(new AppError('Post not found', 404));
    }
    
    if (post.author.toString() !== req.user.id && 
        !['super-admin', 'admin', 'moderator'].includes(req.user.role)) {
      return next(new AppError('Not authorized to delete this post', 403));
    }
    
    post.status = 'deleted';
    await post.save();
    
    res.json({
      success: true,
      message: 'Post deleted successfully'
    });
  } catch (err) {
    next(err);
  }
});

// @route   POST /api/v1/posts/:id/like
// @desc    Лайкнуть пост
// @access  Private
router.post('/:id/like', protect, async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    
    if (!post) {
      return next(new AppError('Post not found', 404));
    }
    
    post.like(req.user.id);
    await post.save();
    
    // Update user likes count
    await User.findByIdAndUpdate(req.user.id, {
      $inc: { likesGiven: 1 }
    });
    
    await User.findByIdAndUpdate(post.author, {
      $inc: { likesReceived: 1 }
    });
    
    res.json({
      success: true,
      message: 'Post liked'
    });
  } catch (err) {
    next(err);
  }
});

// @route   DELETE /api/v1/posts/:id/like
// @desc    Убрать лайк
// @access  Private
router.delete('/:id/like', protect, async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    
    if (!post) {
      return next(new AppError('Post not found', 404));
    }
    
    post.unlike(req.user.id);
    await post.save();
    
    res.json({
      success: true,
      message: 'Like removed'
    });
  } catch (err) {
    next(err);
  }
});

// @route   POST /api/v1/posts/:id/bookmark
// @desc    Добавить в закладки
// @access  Private
router.post('/:id/bookmark', protect, async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    
    if (!post) {
      return next(new AppError('Post not found', 404));
    }
    
    const existingBookmark = post.bookmarks.find(
      b => b.user.toString() === req.user.id
    );
    
    if (!existingBookmark) {
      post.bookmarks.push({ user: req.user.id, createdAt: Date.now() });
      await post.save();
    }
    
    res.json({
      success: true,
      message: 'Added to bookmarks'
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
