const express = require('express');
const { body, validationResult } = require('express-validator');
const StartupProfile = require('../models/StartupProfile');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// Get all startup profiles (public endpoint for investors to browse)
router.get('/all', async (req, res) => {
  try {
    const { page = 1, limit = 10, industry, stage, location } = req.query;
    
    // Build filter object
    const filter = {};
    if (industry) filter.industry = { $regex: industry, $options: 'i' };
    if (stage) filter.stage = stage;
    if (location) filter.location = { $regex: location, $options: 'i' };

    // Calculate pagination
    const skip = (page - 1) * limit;
    const limitNum = parseInt(limit);

    // Get profiles with pagination and filtering
    const profiles = await StartupProfile.find(filter)
      .populate('userId', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    // Get total count for pagination
    const total = await StartupProfile.countDocuments(filter);

    const profilesResponse = profiles.map(profile => ({
      id: profile._id,
      companyName: profile.companyName,
      website: profile.website,
      industry: profile.industry,
      stage: profile.stage,
      location: profile.location,
      foundedYear: profile.foundedYear,
      teamSize: profile.teamSize,
      description: profile.description,
      mission: profile.mission,
      vision: profile.vision,
      socialLinks: profile.socialLinks,
      founder: {
        id: profile.userId._id,
        firstName: profile.userId.firstName,
        lastName: profile.userId.lastName,
        email: profile.userId.email
      },
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
    }));

    res.json({
      profiles: profilesResponse,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limitNum),
        totalProfiles: total,
        hasNextPage: page * limitNum < total,
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get startup profile by ID (public endpoint)
router.get('/:id', async (req, res) => {
  try {
    const profile = await StartupProfile.findById(req.params.id)
      .populate('userId', 'firstName lastName email');
    
    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    const profileResponse = {
      id: profile._id,
      companyName: profile.companyName,
      website: profile.website,
      industry: profile.industry,
      stage: profile.stage,
      location: profile.location,
      foundedYear: profile.foundedYear,
      teamSize: profile.teamSize,
      description: profile.description,
      mission: profile.mission,
      vision: profile.vision,
      socialLinks: profile.socialLinks,
      founder: {
        id: profile.userId._id,
        firstName: profile.userId.firstName,
        lastName: profile.userId.lastName,
        email: profile.userId.email
      },
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
    };

    res.json(profileResponse);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get startup profile for authenticated user
router.get('/', auth, authorize('founder'), async (req, res) => {
  try {
    const profile = await StartupProfile.findOne({ userId: req.user._id });
    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    const profileResponse = {
      id: profile._id,
      companyName: profile.companyName,
      website: profile.website,
      industry: profile.industry,
      stage: profile.stage,
      location: profile.location,
      foundedYear: profile.foundedYear,
      teamSize: profile.teamSize,
      description: profile.description,
      mission: profile.mission,
      vision: profile.vision,
      socialLinks: profile.socialLinks,
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
    };

    res.json(profileResponse);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get startup profiles with advanced filtering (for investors)
router.get('/search/advanced', auth, authorize('investor'), async (req, res) => {
  try {
    const { 
      industry, 
      stage, 
      location, 
      minTeamSize, 
      maxTeamSize, 
      minFoundedYear, 
      maxFoundedYear,
      search,
      page = 1, 
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;
    
    // Build filter object
    const filter = {};
    
    if (industry) filter.industry = { $regex: industry, $options: 'i' };
    if (stage) filter.stage = stage;
    if (location) filter.location = { $regex: location, $options: 'i' };
    if (minTeamSize || maxTeamSize) {
      filter.teamSize = {};
      if (minTeamSize) filter.teamSize.$gte = parseInt(minTeamSize);
      if (maxTeamSize) filter.teamSize.$lte = parseInt(maxTeamSize);
    }
    if (minFoundedYear || maxFoundedYear) {
      filter.foundedYear = {};
      if (minFoundedYear) filter.foundedYear.$gte = parseInt(minFoundedYear);
      if (maxFoundedYear) filter.foundedYear.$lte = parseInt(maxFoundedYear);
    }
    if (search) {
      filter.$or = [
        { companyName: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { mission: { $regex: search, $options: 'i' } },
        { vision: { $regex: search, $options: 'i' } }
      ];
    }

    // Calculate pagination
    const skip = (page - 1) * limit;
    const limitNum = parseInt(limit);

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Get profiles with pagination, filtering, and sorting
    const profiles = await StartupProfile.find(filter)
      .populate('userId', 'firstName lastName email')
      .sort(sort)
      .skip(skip)
      .limit(limitNum);

    // Get total count for pagination
    const total = await StartupProfile.countDocuments(filter);

    // Get aggregated statistics
    const stats = await StartupProfile.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          avgTeamSize: { $avg: '$teamSize' },
          industries: { $addToSet: '$industry' },
          stages: { $addToSet: '$stage' },
          locations: { $addToSet: '$location' }
        }
      }
    ]);

    const profilesResponse = profiles.map(profile => ({
      id: profile._id,
      companyName: profile.companyName,
      website: profile.website,
      industry: profile.industry,
      stage: profile.stage,
      location: profile.location,
      foundedYear: profile.foundedYear,
      teamSize: profile.teamSize,
      description: profile.description,
      mission: profile.mission,
      vision: profile.vision,
      socialLinks: profile.socialLinks,
      founder: {
        id: profile.userId._id,
        firstName: profile.userId.firstName,
        lastName: profile.userId.lastName,
        email: profile.userId.email
      },
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
    }));

    res.json({
      profiles: profilesResponse,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limitNum),
        totalProfiles: total,
        hasNextPage: page * limitNum < total,
        hasPrevPage: page > 1
      },
      statistics: stats[0] || {
        avgTeamSize: 0,
        industries: [],
        stages: [],
        locations: []
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create or update startup profile
router.put('/', [
  auth,
  authorize('founder'),
  body('companyName').notEmpty().trim().isLength({ min: 2 }),
  body('website').optional().isURL(),
  body('industry').notEmpty().trim(),
  body('stage').notEmpty().isIn(['idea', 'prototype', 'mvp', 'growth', 'scale']),
  body('location').notEmpty().trim(),
  body('foundedYear').isInt({ min: 1900, max: new Date().getFullYear() }),
  body('teamSize').isInt({ min: 1 }),
  body('description').notEmpty().trim().isLength({ min: 50 }),
  body('mission').notEmpty().trim().isLength({ min: 20 }),
  body('vision').notEmpty().trim().isLength({ min: 20 }),
  body('socialLinks').optional().isArray(),
  body('socialLinks.*.platform').notEmpty().trim(),
  body('socialLinks.*.url').isURL(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const profileData = {
      userId: req.user._id,
      companyName: req.body.companyName,
      website: req.body.website,
      industry: req.body.industry,
      stage: req.body.stage,
      location: req.body.location,
      foundedYear: req.body.foundedYear,
      teamSize: req.body.teamSize,
      description: req.body.description,
      mission: req.body.mission,
      vision: req.body.vision,
      socialLinks: req.body.socialLinks || [],
    };

    let profile = await StartupProfile.findOne({ userId: req.user._id });
    if (profile) {
      // Update existing profile
      profile = await StartupProfile.findOneAndUpdate(
        { userId: req.user._id },
        { $set: profileData },
        { new: true }
      );
    } else {
      // Create new profile
      profile = new StartupProfile(profileData);
      await profile.save();
    }

    const profileResponse = {
      id: profile._id,
      companyName: profile.companyName,
      website: profile.website,
      industry: profile.industry,
      stage: profile.stage,
      location: profile.location,
      foundedYear: profile.foundedYear,
      teamSize: profile.teamSize,
      description: profile.description,
      mission: profile.mission,
      vision: profile.vision,
      socialLinks: profile.socialLinks,
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
    };

    res.json(profileResponse);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete startup profile
router.delete('/', auth, authorize('founder'), async (req, res) => {
  try {
    const profile = await StartupProfile.findOneAndDelete({ userId: req.user._id });
    
    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    res.json({ message: 'Profile deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;