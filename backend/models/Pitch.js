const mongoose = require('mongoose');

const voteSchema = new mongoose.Schema({
  pitchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Pitch',
    required: true
  },
  investorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  score: {
    type: Number,
    required: true,
    min: 1,
    max: 10
  }
}, {
  timestamps: true
});

const commentSchema = new mongoose.Schema({
  pitchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Pitch',
    required: true
  },
  investorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

const pitchSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  problem: {
    type: String,
    required: true
  },
  solution: {
    type: String,
    required: true
  },
  market: {
    type: String,
    required: true
  },
  businessModel: {
    type: String,
    required: true
  },
  competition: {
    type: String,
    required: true
  },
  team: {
    type: String,
    required: true
  },
  financials: {
    type: String,
    required: true
  },
  fundingAmount: {
    type: Number,
    required: true
  },
  equity: {
    type: Number,
    required: true
  },
  stage: {
    type: String,
    enum: ['idea', 'prototype', 'mvp', 'growth', 'scale'],
    required: true
  },
  industry: {
    type: String,
    required: true
  },
  location: {
    type: String,
    required: true
  },
  founderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  contestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Contest'
  }
}, {
  timestamps: true
});

const Vote = mongoose.model('Vote', voteSchema);
const Comment = mongoose.model('Comment', commentSchema);
const Pitch = mongoose.model('Pitch', pitchSchema);

module.exports = { Pitch, Vote, Comment };