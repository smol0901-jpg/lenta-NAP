/**
 * Мongoose модели данных NEURAL_HARMONY
 * @author NEURAL_ARCHITECT_PREMIUM++
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// User Schema
const userSchema = new mongoose.Schema({
  // Auth
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    select: false
  },
  phone: String,
  
  // Profile
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  middleName: String,
  avatar: String,
  coverImage: String,
  bio: String,
  birthDate: Date,
  gender: {
    type: String,
    enum: ['male', 'female', 'other', 'not-specified']
  },
  
  // Work Info
  position: String,
  department: String,
  division: String,
  manager: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  employees: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  hireDate: Date,
  workLocation: String,
  office: String,
  deskNumber: String,
  employeeId: String,
  skills: [String],
  competencies: [{
    name: String,
    level: {
      type: Number,
      min: 1,
      max: 10
    }
  }],
  
  // Contact
  contacts: {
    telegram: String,
    whatsapp: String,
    skype: String,
    linkedin: String,
    github: String,
    website: String
  },
  
  // Status
  status: {
    type: String,
    enum: ['active', 'inactive', 'vacation', 'sick', 'remote', 'busy'],
    default: 'active'
  },
  online: {
    type: Boolean,
    default: false
  },
  lastSeen: Date,
  
  // Role & Permissions
  role: {
    type: String,
    enum: [
      'super-admin',
      'admin',
      'moderator',
      'hr-manager',
      'department-head',
      'team-lead',
      'employee',
      'intern',
      'consultant',
      'guest',
      'banned'
    ],
    default: 'employee'
  },
  permissions: [{
    resource: String,
    actions: [String]
  }],
  accessGroups: [String],
  
  // Privacy
  privacy: {
    profileVisibility: {
      type: String,
      enum: ['public', 'friends', 'private'],
      default: 'public'
    },
    showEmail: { type: Boolean, default: false },
    showPhone: { type: Boolean, default: false },
    showBirthDate: { type: Boolean, default: true },
    allowMessages: { type: Boolean, default: true },
    allowFriendRequests: { type: Boolean, default: true }
  },
  
  // Social
  friends: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'blocked'],
      default: 'pending'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  followers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  following: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  blacklist: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  
  // Achievements
  achievements: [{
    id: String,
    name: String,
    description: String,
    icon: String,
    earnedAt: Date,
    points: Number
  }],
  badges: [String],
  rating: {
    type: Number,
    default: 0
  },
  reputation: {
    type: Number,
    default: 0
  },
  
  // Activity
  postsCount: {
    type: Number,
    default: 0
  },
  commentsCount: {
    type: Number,
    default: 0
  },
  likesReceived: {
    type: Number,
    default: 0
  },
  likesGiven: {
    type: Number,
    default: 0
  },
  
  // Settings
  settings: {
    language: { type: String, default: 'ru' },
    timezone: { type: String, default: 'Europe/Moscow' },
    theme: {
      type: String,
      enum: ['light', 'dark', 'auto'],
      default: 'light'
    },
    notifications: {
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
      sound: { type: Boolean, default: true },
      messages: { type: Boolean, default: true },
      mentions: { type: Boolean, default: true },
      likes: { type: Boolean, default: true },
      comments: { type: Boolean, default: true },
      friendRequests: { type: Boolean, default: true },
      groupInvites: { type: Boolean, default: true },
      events: { type: Boolean, default: true }
    }
  },
  
  // Wellness
  wellness: {
    moodTracker: [{
      date: Date,
      mood: {
        type: Number,
        min: 1,
        max: 10
      },
      note: String
    }],
    stressLevel: {
      type: Number,
      min: 1,
      max: 10,
      default: 5
    },
    workLifeBalance: {
      type: Number,
      min: 1,
      max: 10,
      default: 5
    }
  },
  
  // AI
  aiProfile: {
    interests: [String],
    behaviorPatterns: [String],
    preferredContentTypes: [String],
    activityPeaks: [Number],
    sentimentScore: {
      type: Number,
      default: 0.5
    }
  },
  
  // System
  refreshToken: String,
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  emailVerificationToken: String,
  emailVerified: {
    type: Boolean,
    default: false
  },
  twoFactorEnabled: {
    type: Boolean,
    default: false
  },
  twoFactorSecret: String,
  
  // Timestamps
  lastLogin: Date,
  lastPasswordChange: Date,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
userSchema.index({ email: 1 });
userSchema.index({ firstName: 1, lastName: 1 });
userSchema.index({ position: 1, department: 1 });
userSchema.index({ role: 1 });
userSchema.index({ status: 1 });
userSchema.index({ 'friends.user': 1 });

// Virtuals
userSchema.virtual('fullName').get(function() {
  return `${this.lastName} ${this.firstName} ${this.middleName || ''}`.trim();
});

userSchema.virtual('profileUrl').get(function() {
  return `/users/${this._id}`;
});

userSchema.virtual('isOnline').get(function() {
  if (!this.lastSeen) return false;
  return Date.now() - this.lastSeen.getTime() < 300000; // 5 minutes
});

// Password hashing
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Generate JWT payload
userSchema.methods.getJWTData = function() {
  return {
    id: this._id,
    email: this.email,
    role: this.role,
    firstName: this.firstName,
    lastName: this.lastName,
    avatar: this.avatar
  };
};

// Update timestamp
userSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('User', userSchema);
