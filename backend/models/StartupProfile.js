const mongoose = require('mongoose');

const startupProfileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  companyName: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
  },
  website: {
    type: String,
    trim: true,
    match: /^https?:\/\/.+/,
  },
  industry: {
    type: String,
    required: true,
    trim: true,
  },
  stage: {
    type: String,
    required: true,
    enum: ['idea', 'prototype', 'mvp', 'growth', 'scale'],
  },
  location: {
    type: String,
    required: true,
    trim: true,
  },
  foundedYear: {
    type: Number,
    required: true,
    min: 1900,
    max: new Date().getFullYear(),
  },
  teamSize: {
    type: Number,
    required: true,
    min: 1,
  },
  description: {
    type: String,
    required: true,
    trim: true,
    minlength: 50,
  },
  mission: {
    type: String,
    required: true,
    trim: true,
    minlength: 20,
  },
  vision: {
    type: String,
    required: true,
    trim: true,
    minlength: 20,
  },
  socialLinks: [{
    platform: {
      type: String,
      required: true,
      trim: true,
    },
    url: {
      type: String,
      required: true,
      trim: true,
      match: /^https?:\/\/.+/,
    },
  }],
}, {
  timestamps: true,
});

module.exports = mongoose.model('StartupProfile', startupProfileSchema);