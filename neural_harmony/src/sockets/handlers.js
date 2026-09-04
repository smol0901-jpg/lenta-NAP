/**
 * WebSocket обработчики NEURAL_HARMONY
 * @author NEURAL_ARCHITECT_PREMIUM++
 */

const logger = require('../utils/logger');

// Store online users
const onlineUsers = new Map();
const userSockets = new Map();

module.exports = (io, socket) => {
  // Handle authentication
  socket.on('authenticate', (data) => {
    const { userId } = data;
    
    if (userId) {
      socket.userId = userId;
      onlineUsers.set(userId, {
        socketId: socket.id,
        lastSeen: Date.now()
      });
      userSockets.set(socket.id, userId);
      
      // Broadcast user online status
      io.emit('user:online', { userId, status: 'online' });
      
      logger.info(`User ${userId} authenticated on socket ${socket.id}`);
    }
  });
  
  // Handle messages
  socket.on('message:send', (data) => {
    const { recipientId, content, type } = data;
    
    // Emit to recipient
    const recipientSocket = Array.from(userSockets.entries())
      .find(([sid, uid]) => uid === recipientId);
    
    if (recipientSocket) {
      io.to(recipientSocket[0]).emit('message:receive', {
        senderId: socket.userId,
        content,
        type,
        timestamp: Date.now()
      });
    }
    
    // Store message (in production, save to database)
    logger.info(`Message from ${socket.userId} to ${recipientId}`);
  });
  
  // Handle typing indicators
  socket.on('typing:start', (data) => {
    const { conversationId } = data;
    socket.to(conversationId).emit('typing:update', {
      userId: socket.userId,
      isTyping: true
    });
  });
  
  socket.on('typing:stop', (data) => {
    const { conversationId } = data;
    socket.to(conversationId).emit('typing:update', {
      userId: socket.userId,
      isTyping: false
    });
  });
  
  // Handle notifications
  socket.on('notification:send', (data) => {
    const { recipientId, title, message, type } = data;
    
    const recipientSocket = Array.from(userSockets.entries())
      .find(([sid, uid]) => uid === recipientId);
    
    if (recipientSocket) {
      io.to(recipientSocket[0]).emit('notification:receive', {
        title,
        message,
        type,
        timestamp: Date.now()
      });
    }
  });
  
  // Handle game events
  socket.on('game:invite', (data) => {
    const { targetUserId, gameId, roomId } = data;
    
    const targetSocket = Array.from(userSockets.entries())
      .find(([sid, uid]) => uid === targetUserId);
    
    if (targetSocket) {
      io.to(targetSocket[0]).emit('game:invite:receive', {
        fromUserId: socket.userId,
        gameId,
        roomId,
        timestamp: Date.now()
      });
    }
  });
  
  socket.on('game:move', (data) => {
    const { roomId, move } = data;
    socket.to(roomId).emit('game:move:receive', {
      playerId: socket.userId,
      move,
      timestamp: Date.now()
    });
  });
  
  // Handle post interactions
  socket.on('post:like', (data) => {
    const { postId } = data;
    // Broadcast to post author and subscribers
    socket.broadcast.emit('post:liked', {
      postId,
      userId: socket.userId,
      timestamp: Date.now()
    });
  });
  
  socket.on('post:comment', (data) => {
    const { postId, comment } = data;
    socket.broadcast.emit('post:commented', {
      postId,
      userId: socket.userId,
      comment,
      timestamp: Date.now()
    });
  });
  
  // Handle group events
  socket.on('group:join', (data) => {
    const { groupId } = data;
    socket.join(groupId);
    io.to(groupId).emit('group:user:joined', {
      groupId,
      userId: socket.userId,
      timestamp: Date.now()
    });
  });
  
  socket.on('group:leave', (data) => {
    const { groupId } = data;
    socket.leave(groupId);
    io.to(groupId).emit('group:user:left', {
      groupId,
      userId: socket.userId,
      timestamp: Date.now()
    });
  });
  
  // Handle disconnect
  socket.on('disconnect', () => {
    if (socket.userId) {
      onlineUsers.delete(socket.userId);
      userSockets.delete(socket.id);
      
      // Broadcast user offline status
      io.emit('user:offline', { 
        userId: socket.userId, 
        status: 'offline',
        lastSeen: Date.now()
      });
      
      logger.info(`User ${socket.userId} disconnected`);
    }
  });
  
  // Handle errors
  socket.on('error', (err) => {
    logger.error(`Socket error: ${err.message}`);
  });
};
