/**
 * Routes сообщений NEURAL_HARMONY
 * @author NEURAL_ARCHITECT_PREMIUM++
 */

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { AppError } = require('../middleware/errorHandler');

// In-memory store for demo (use Redis in production)
const conversations = new Map();
const messages = [];

// @route   GET /api/v1/messages/conversations
// @desc    Получить все диалоги пользователя
// @access  Private
router.get('/conversations', protect, async (req, res, next) => {
  try {
    const userConversations = Array.from(conversations.values())
      .filter(c => c.participants.includes(req.user.id));
    
    res.json({
      success: true,
      data: { conversations: userConversations }
    });
  } catch (err) {
    next(err);
  }
});

// @route   GET /api/v1/messages/:conversationId
// @desc    Получить сообщения диалога
// @access  Private
router.get('/:conversationId', protect, async (req, res, next) => {
  try {
    const conversation = conversations.get(req.params.conversationId);
    
    if (!conversation) {
      return next(new AppError('Conversation not found', 404));
    }
    
    if (!conversation.participants.includes(req.user.id)) {
      return next(new AppError('Not authorized', 403));
    }
    
    const conversationMessages = messages.filter(
      m => m.conversationId === req.params.conversationId
    ).sort((a, b) => a.createdAt - b.createdAt);
    
    res.json({
      success: true,
      data: { 
        conversation,
        messages: conversationMessages
      }
    });
  } catch (err) {
    next(err);
  }
});

// @route   POST /api/v1/messages
// @desc    Отправить сообщение
// @access  Private
router.post('/', protect, async (req, res, next) => {
  try {
    const { recipientId, content, type = 'text', attachments } = req.body;
    
    // Create or get conversation
    const conversationKey = [req.user.id, recipientId].sort().join('-');
    let conversation = conversations.get(conversationKey);
    
    if (!conversation) {
      conversation = {
        id: conversationKey,
        participants: [req.user.id, recipientId],
        lastMessage: null,
        updatedAt: Date.now()
      };
      conversations.set(conversationKey, conversation);
    }
    
    // Create message
    const message = {
      id: `msg_${Date.now()}_${Math.random()}`,
      conversationId: conversationKey,
      sender: req.user.id,
      recipient: recipientId,
      content,
      type,
      attachments,
      isRead: false,
      createdAt: Date.now()
    };
    
    messages.push(message);
    conversation.lastMessage = message;
    conversation.updatedAt = Date.now();
    
    res.status(201).json({
      success: true,
      message: 'Message sent',
      data: { message }
    });
  } catch (err) {
    next(err);
  }
});

// @route   PUT /api/v1/messages/:messageId/read
// @desc    Пометить сообщение как прочитанное
// @access  Private
router.put('/:messageId/read', protect, async (req, res, next) => {
  try {
    const messageIndex = messages.findIndex(m => m.id === req.params.messageId);
    
    if (messageIndex === -1) {
      return next(new AppError('Message not found', 404));
    }
    
    messages[messageIndex].isRead = true;
    messages[messageIndex].readAt = Date.now();
    
    res.json({
      success: true,
      message: 'Message marked as read'
    });
  } catch (err) {
    next(err);
  }
});

// @route   DELETE /api/v1/messages/:messageId
// @desc    Удалить сообщение
// @access  Private
router.delete('/:messageId', protect, async (req, res, next) => {
  try {
    const messageIndex = messages.findIndex(m => m.id === req.params.messageId);
    
    if (messageIndex === -1) {
      return next(new AppError('Message not found', 404));
    }
    
    const message = messages[messageIndex];
    
    if (message.sender.toString() !== req.user.id) {
      return next(new AppError('Not authorized to delete this message', 403));
    }
    
    messages.splice(messageIndex, 1);
    
    res.json({
      success: true,
      message: 'Message deleted'
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
