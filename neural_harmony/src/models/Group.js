/**
 * Модель группы NEURAL_HARMONY
 * @author NEURAL_ARCHITECT_PREMIUM++
 */

const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema({
  // Basic Info
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    maxlength: 2000
  },
  avatar: String,
  coverImage: String,
  
  // Type & Privacy
  type: {
    type: String,
    enum: ['public', 'closed', 'secret'],
    default: 'public'
  },
  category: {
    type: String,
    enum: ['department', 'project', 'interest', 'event', 'official', 'other'],
    default: 'other'
  },
  
  // Administration
  admins: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    role: {
      type: String,
      enum: ['creator', 'admin', 'moderator'],
      default: 'admin'
    },
    permissions: [String],
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Members
  members: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    role: {
      type: String,
      enum: ['member', 'contributor', 'viewer'],
      default: 'member'
    },
    status: {
      type: String,
      enum: ['active', 'pending', 'banned'],
      default: 'active'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Invites
  invites: [{
    code: String,
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    maxUses: Number,
    usedCount: {
      type: Number,
      default: 0
    },
    expiresAt: Date,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Content
  posts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post'
  }],
  announcements: [{
    title: String,
    content: String,
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    createdAt: Date,
    isPinned: Boolean
  }],
  
  // Discussions
  discussions: [{
    title: String,
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    messages: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      content: String,
      createdAt: Date
    }],
    createdAt: Date
  }],
  
  // Files
  files: [{
    name: String,
    url: String,
    size: Number,
    type: String,
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    uploadedAt: Date
  }],
  
  // Albums
  photoAlbums: [{
    title: String,
    description: String,
    coverPhoto: String,
    photos: [{
      url: String,
      thumbnail: String,
      caption: String,
      uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      uploadedAt: Date
    }],
    createdAt: Date
  }],
  
  // Videos
  videos: [{
    title: String,
    url: String,
    thumbnail: String,
    duration: Number,
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    uploadedAt: Date
  }],
  
  // Audio
  audio: [{
    title: String,
    artist: String,
    url: String,
    duration: Number,
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    uploadedAt: Date
  }],
  
  // Events
  events: [{
    title: String,
    description: String,
    startDate: Date,
    endDate: Date,
    location: String,
    organizer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    attendees: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      status: {
        type: String,
        enum: ['going', 'maybe', 'not-going'],
        default: 'maybe'
      }
    }],
    isOnline: Boolean,
    meetingLink: String
  }],
  
  // Polls
  polls: [{
    question: String,
    options: [{
      text: String,
      votes: Number
    }],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    createdAt: Date,
    expiresAt: Date
  }],
  
  // Wiki Pages
  wikiPages: [{
    title: String,
    slug: String,
    content: String,
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    lastEditedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    lastEditedAt: Date,
    createdAt: Date
  }],
  
  // Settings
  settings: {
    postApproval: {
      type: Boolean,
      default: false
    },
    memberInvite: {
      type: Boolean,
      default: true
    },
    allowPosts: {
      type: Boolean,
      default: true
    },
    allowComments: {
      type: Boolean,
      default: true
    },
    showMembers: {
      type: Boolean,
      default: true
    }
  },
  
  // Statistics
  stats: {
    postsCount: {
      type: Number,
      default: 0
    },
    membersCount: {
      type: Number,
      default: 0
    },
    onlineMembers: {
      type: Number,
      default: 0
    }
  },
  
  // AI Analysis
  aiAnalysis: {
    topics: [String],
    activityLevel: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    },
    engagementScore: {
      type: Number,
      min: 0,
      max: 100
    }
  },
  
  // Status
  isActive: {
    type: Boolean,
    default: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes
groupSchema.index({ name: 1 });
groupSchema.index({ type: 1, category: 1 });
groupSchema.index({ 'members.user': 1 });
groupSchema.index({ 'admins.user': 1 });
groupSchema.index({ isActive: 1, createdAt: -1 });

// Virtuals
groupSchema.virtual('membersCount').get(function() {
  return this.members.filter(m => m.status === 'active').length;
});

groupSchema.virtual('url').get(function() {
  return `/groups/${this._id}`;
});

// Methods
groupSchema.methods.isMember = function(userId) {
  return this.members.some(m => 
    m.user.toString() === userId.toString() && m.status === 'active'
  );
};

groupSchema.methods.isAdmin = function(userId) {
  return this.admins.some(a => 
    a.user.toString() === userId.toString()
  );
};

groupSchema.methods.addMember = function(userId, role = 'member') {
  const existing = this.members.find(m => 
    m.user.toString() === userId.toString()
  );
  
  if (!existing) {
    this.members.push({ user: userId, role, status: 'active' });
    this.stats.membersCount = this.membersCount;
  }
};

groupSchema.methods.removeMember = function(userId) {
  this.members = this.members.filter(m => 
    m.user.toString() !== userId.toString()
  );
  this.stats.membersCount = this.membersCount;
};

// Update timestamp
groupSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  this.stats.membersCount = this.members.filter(m => m.status === 'active').length;
  next();
});

module.exports = mongoose.model('Group', groupSchema);
