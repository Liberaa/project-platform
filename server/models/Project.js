const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  tech: [{
    type: String,
    trim: true
  }],
  path: {
    type: String,
    required: true
  },
  thumbnail: {
    type: String,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  published: {
    type: Boolean,
    default: true
  },
  views: {
    type: Number,
    default: 0
  }
});

// Add indexes for performance
projectSchema.index({ ownerId: 1 });
projectSchema.index({ published: 1, createdAt: -1 });

module.exports = mongoose.model('Project', projectSchema);
