/**
 * Модель поста NEURAL_HARMONY
 * @author NEURAL_ARCHITECT_PREMIUM++
 */

const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  // Author
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Content
  content: {
    type: String,
    trim: true,
    maxlength: 10000
  },
  title: {
    type: String,
    trim: true,
    maxlength: 200
  },
  
  // Media
  images: [{
    url: String,
    thumbnail: String,
    caption: String,
    width: Number,
    height: Number,
    size: Number
  }],
  videos: [{
    url: String,
    thumbnail: String,
    duration: Number,
    size: Number,
    format: String
  }],
  audio: [{
    url: String,
    duration: Number,
    size: Number,
    title: String,
    artist: String
  }],
  documents: [{
    url: String,
    name: String,
    size: Number,
    type: String
  }],
  drawings: [{
    url: String,
    thumbnail: String,
    data: String, // Base64 canvas data
    createdAt: Date
  }],
  
  // Type
  type: {
    type: String,
    enum: ['text', 'photo', 'video', 'audio', 'poll', 'drawing', 'mixed', 'repost'],
    default: 'text'
  },
  
  // Poll
  poll: {
    question: String,
    options: [{
      text: String,
      votes: {
        type: Number,
        default: 0
      }
    }],
    multiple: {
      type: Boolean,
      default: false
    },
    expiresAt: Date,
    voters: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      option: Number
    }]
  },
  
  // Repost
  repostOf: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post'
  },
  repostData: {
    originalAuthor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    originalContent: String,
    repostedAt: Date
  },
  
  // Engagement
  likes: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  reactions: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    emoji: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  commentsCount: {
    type: Number,
    default: 0
  },
  sharesCount: {
    type: Number,
    default: 0
  },
  viewsCount: {
    type: Number,
    default: 0
  },
  
  // Tags & Mentions
  hashtags: [String],
  mentions: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    position: Number
  }],
  
  // Location
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: [Number] // [longitude, latitude]
  },
  placeName: String,
  
  // Visibility
  visibility: {
    type: String,
    enum: ['public', 'friends', 'private', 'group'],
    default: 'public'
  },
  group: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group'
  },
  
  // Status
  status: {
    type: String,
    enum: ['draft', 'published', 'scheduled', 'archived', 'deleted'],
    default: 'published'
  },
  isPinned: {
    type: Boolean,
    default: false
  },
  isEdited: {
    type: Boolean,
    default: false
  },
  editHistory: [{
    content: String,
    editedAt: Date,
    editor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  
  // Scheduling
  scheduledFor: Date,
  publishedAt: {
    type: Date,
    default: Date.now
  },
  
  // AI Analysis
  aiAnalysis: {
    sentiment: {
      type: Number,
      min: -1,
      max: 1
    },
    topics: [String],
    language: String,
    toxicity: {
      type: Number,
      min: 0,
      max: 1
    },
    spamScore: {
      type: Number,
      min: 0,
      max: 1
    },
    suggestedHashtags: [String],
    qualityScore: {
      type: Number,
      min: 0,
      max: 100
    }
  },
  
  // Moderation
  moderation: {
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'flagged'],
      default: 'approved'
    },
    flaggedBy: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      reason: String,
      flaggedAt: Date
    }],
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reviewedAt: Date,
    moderationNotes: String
  },
  
  // Bookmarks
  bookmarks: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    createdAt: Date
  }],
  
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
postSchema.index({ author: 1, createdAt: -1 });
postSchema.index({ createdAt: -1 });
postSchema.index({ hashtags: 1 });
postSchema.index({ 'mentions.user': 1 });
postSchema.index({ type: 1, status: 1 });
postSchema.index({ 'location': '2dsphere' });
postSchema.index({ likes: 1 });
postSchema.index({ bookmarks: 1 });

// Virtuals
postSchema.virtual('likesCount').get(function() {
  return this.likes.length + (this.reactions ? this.reactions.length : 0);
});

postSchema.virtual('url').get(function() {
  return `/posts/${this._id}`;
});

// Methods
postSchema.methods.like = function(userId) {
  const existingLike = this.likes.find(like => 
    like.user.toString() === userId.toString()
  );
  
  if (!existingLike) {
    this.likes.push({ user: userId });
  }
};

postSchema.methods.unlike = function(userId) {
  this.likes = this.likes.filter(like => 
    like.user.toString() !== userId.toString()
  );
};

postSchema.methods.addReaction = function(userId, emoji) {
  const existingReaction = this.reactions.find(reaction => 
    reaction.user.toString() === userId.toString()
  );
  
  if (existingReaction) {
    existingReaction.emoji = emoji;
  } else {
    this.reactions.push({ user: userId, emoji });
  }
};

postSchema.methods.vote = function(userId, optionIndex) {
  if (!this.poll) return;
  
  const existingVote = this.poll.voters.find(voter => 
    voter.user.toString() === userId.toString()
  );
  
  if (existingVote) {
    // Remove old vote
    this.poll.options[existingVote.option].votes--;
    existingVote.option = optionIndex;
  } else {
    this.poll.voters.push({ user: userId, option: optionIndex });
  }
  
  // Add new vote
  this.poll.options[optionIndex].votes++;
};

// Update timestamp
postSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Post', postSchema);
