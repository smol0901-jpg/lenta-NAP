/**
 * Главный API роутер NEURAL_HARMONY
 * @author NEURAL_ARCHITECT_PREMIUM++
 */

const express = require('express');
const router = express.Router();

// Health check
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'NEURAL_HARMONY',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    logo: '🦢 NEURAL_ARCHITECT_PREMIUM++'
  });
});

// API Info
router.get('/', (req, res) => {
  res.json({
    name: 'NEURAL_HARMONY API',
    description: 'Корпоративная социальная сеть с ИИ для улучшения морального духа сотрудников',
    version: 'v1',
    author: 'NEURAL_ARCHITECT_PREMIUM++',
    endpoints: {
      auth: '/api/v1/auth',
      users: '/api/v1/users',
      posts: '/api/v1/posts',
      messages: '/api/v1/messages',
      groups: '/api/v1/groups',
      games: '/api/v1/games',
      ai: '/api/v1/ai',
      upload: '/api/v1/upload',
      admin: '/api/v1/admin'
    },
    features: [
      'Профили сотрудников',
      'Лента новостей',
      'Сообщения и чаты',
      'Группы и сообщества',
      'Онлайн игры (50+)',
      'ИИ аналитика',
      'Голосовые сообщения',
      'Рисование на стене',
      'Загрузка фото/видео/аудио',
      'Ролевая система',
      'API интеграции'
    ],
    documentation: '/api/docs'
  });
});

module.exports = router;
