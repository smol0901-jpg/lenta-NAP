/**
 * Routes игр NEURAL_HARMONY
 * @author NEURAL_ARCHITECT_PREMIUM++
 */

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { AppError } = require('../middleware/errorHandler');

// In-memory game store (use Redis in production)
const games = new Map();
const gameRooms = new Map();

// Available games list
const availableGames = [
  { id: 'chess', name: 'Шахматы', players: 2, category: 'strategy' },
  { id: 'checkers', name: 'Шашки', players: 2, category: 'strategy' },
  { id: 'backgammon', name: 'Нарды', players: 2, category: 'strategy' },
  { id: 'tictactoe', name: 'Крестики-нолики', players: 2, category: 'casual' },
  { id: 'go', name: 'Го', players: 2, category: 'strategy' },
  { id: 'reversi', name: 'Реверси', players: 2, category: 'strategy' },
  { id: 'battleship', name: 'Морской бой', players: 2, category: 'strategy' },
  { id: 'durok', name: 'Дурак', players: 2, category: 'cards' },
  { id: 'poker', name: 'Покер', players: 6, category: 'cards' },
  { id: 'blackjack', name: 'Блэкджек', players: 5, category: 'cards' },
  { id: 'quiz', name: 'Викторина', players: 10, category: 'trivia' },
  { id: 'hangman', name: 'Виселица', players: 2, category: 'word' },
  { id: 'cities', name: 'Города', players: 5, category: 'word' },
  { id: 'words', name: 'Слова', players: 5, category: 'word' },
  { id: 'mafia', name: 'Мафия', players: 10, category: 'social' },
  { id: 'crocodile', name: 'Крокодил', players: 8, category: 'party' },
  { id: '2048', name: '2048', players: 1, category: 'puzzle' },
  { id: 'snake', name: 'Змейка', players: 1, category: 'arcade' },
  { id: 'tetris', name: 'Тетрис', players: 1, category: 'puzzle' },
  { id: 'pacman', name: 'Пакман', players: 1, category: 'arcade' },
  { id: 'breakout', name: 'Арканоид', players: 1, category: 'arcade' },
  { id: 'pingpong', name: 'Пинг-понг', players: 2, category: 'sports' },
  { id: 'airhockey', name: 'Аэрохоккей', players: 2, category: 'sports' },
  { id: 'bowling', name: 'Боулинг', players: 4, category: 'sports' },
  { id: 'billiards', name: 'Бильярд', players: 2, category: 'sports' },
  { id: 'darts', name: 'Дартс', players: 4, category: 'sports' },
  { id: 'golf', name: 'Гольф', players: 4, category: 'sports' },
  { id: 'penalty', name: 'Футбол пенальти', players: 2, category: 'sports' },
  { id: 'basketball', name: 'Баскетбол', players: 2, category: 'sports' },
  { id: 'tennis', name: 'Теннис', players: 2, category: 'sports' },
  { id: 'domino', name: 'Домино', players: 4, category: 'board' },
  { id: 'loto', name: 'Лото', players: 6, category: 'board' },
  { id: 'bingo', name: 'Бинго', players: 10, category: 'board' },
  { id: 'dice', name: 'Кости', players: 4, category: 'board' },
  { id: 'rps', name: 'Камень-ножницы-бумага', players: 2, category: 'casual' },
  { id: 'coinflip', name: 'Орёл или решка', players: 2, category: 'casual' },
  { id: 'guessnumber', name: 'Угадай число', players: 2, category: 'casual' },
  { id: 'bullscows', name: 'Быки и коровы', players: 2, category: 'logic' },
  { id: 'jenga', name: 'Башня (Дженга)', players: 4, category: 'party' },
  { id: 'contact', name: 'Контакт', players: 6, category: 'word' },
  { id: 'balda', name: 'Балда', players: 4, category: 'word' },
  { id: 'erudit', name: 'Эрудит', players: 4, category: 'word' },
  { id: 'scrabble', name: 'Скраббл', players: 4, category: 'word' },
  { id: 'association', name: 'Ассоциации', players: 6, category: 'party' },
  { id: 'hat', name: 'Шляпа', players: 6, category: 'party' },
  { id: 'danetki', name: 'Данетки', players: 6, category: 'mystery' },
  { id: 'riddles', name: 'Загадки', players: 10, category: 'trivia' },
  { id: 'tests', name: 'Тесты', players: 1, category: 'trivia' },
  { id: 'trivia', name: 'Викторины', players: 10, category: 'trivia' }
];

// @route   GET /api/v1/games
// @desc    Получить список всех игр
// @access  Private
router.get('/', protect, async (req, res, next) => {
  try {
    const { category } = req.query;
    
    let filteredGames = availableGames;
    if (category) {
      filteredGames = availableGames.filter(g => g.category === category);
    }
    
    res.json({
      success: true,
      data: { 
        games: filteredGames,
        total: filteredGames.length,
        categories: [...new Set(availableGames.map(g => g.category))]
      }
    });
  } catch (err) {
    next(err);
  }
});

// @route   POST /api/v1/games/create
// @desc    Создать игровую комнату
// @access  Private
router.post('/create', protect, async (req, res, next) => {
  try {
    const { gameId, roomName, isPrivate, maxPlayers } = req.body;
    
    const game = availableGames.find(g => g.id === gameId);
    if (!game) {
      return next(new AppError('Game not found', 404));
    }
    
    const roomId = `room_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const room = {
      id: roomId,
      game: gameId,
      name: roomName || `${game.name} Room`,
      creator: req.user.id,
      players: [{ userId: req.user.id, ready: true }],
      maxPlayers: maxPlayers || game.players,
      isPrivate: isPrivate || false,
      status: 'waiting',
      createdAt: Date.now()
    };
    
    gameRooms.set(roomId, room);
    
    res.status(201).json({
      success: true,
      message: 'Game room created',
      data: { room }
    });
  } catch (err) {
    next(err);
  }
});

// @route   GET /api/v1/games/rooms
// @desc    Получить активные комнаты
// @access  Private
router.get('/rooms', protect, async (req, res, next) => {
  try {
    const rooms = Array.from(gameRooms.values())
      .filter(r => r.status === 'waiting' && !r.isPrivate)
      .map(r => ({
        id: r.id,
        game: r.game,
        name: r.name,
        players: r.players.length,
        maxPlayers: r.maxPlayers,
        creator: r.creator
      }));
    
    res.json({
      success: true,
      data: { rooms }
    });
  } catch (err) {
    next(err);
  }
});

// @route   POST /api/v1/games/:roomId/join
// @desc    Присоединиться к игре
// @access  Private
router.post('/:roomId/join', protect, async (req, res, next) => {
  try {
    const room = gameRooms.get(req.params.roomId);
    
    if (!room) {
      return next(new AppError('Room not found', 404));
    }
    
    if (room.players.length >= room.maxPlayers) {
      return next(new AppError('Room is full', 400));
    }
    
    room.players.push({ userId: req.user.id, ready: false });
    
    res.json({
      success: true,
      message: 'Joined room successfully',
      data: { room }
    });
  } catch (err) {
    next(err);
  }
});

// @route   GET /api/v1/games/leaderboard
// @desc    Получить таблицу лидеров
// @access  Public
router.get('/leaderboard', protect, async (req, res, next) => {
  try {
    // Demo leaderboard
    const leaderboard = [
      { rank: 1, userId: 'user1', name: 'Иван Петров', rating: 2500, wins: 150 },
      { rank: 2, userId: 'user2', name: 'Мария Иванова', rating: 2450, wins: 142 },
      { rank: 3, userId: 'user3', name: 'Алексей Смирнов', rating: 2400, wins: 138 },
      { rank: 4, userId: 'user4', name: 'Елена Козлова', rating: 2350, wins: 130 },
      { rank: 5, userId: 'user5', name: 'Дмитрий Новиков', rating: 2300, wins: 125 }
    ];
    
    res.json({
      success: true,
      data: { leaderboard }
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
