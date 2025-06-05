const mongoose = require('mongoose');

const contestSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  prize: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['upcoming', 'active', 'ended'],
    default: function() {
      const now = new Date();
      if (now < this.startDate) return 'upcoming';
      if (now <= this.endDate) return 'active';
      return 'ended';
    }
  },
  pitches: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Pitch'
  }],
  winnerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Pitch'
  }
}, {
  timestamps: true
});

// Update status based on dates
contestSchema.pre('save', function(next) {
  const now = new Date();
  if (now < this.startDate) {
    this.status = 'upcoming';
  } else if (now <= this.endDate) {
    this.status = 'active';
  } else {
    this.status = 'ended';
  }
  next();
});

module.exports = mongoose.model('Contest', contestSchema);
