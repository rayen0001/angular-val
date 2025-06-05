const express = require('express');
const { body, validationResult } = require('express-validator');
const Contest = require('../models/Contest');
const { Pitch } = require('../models/Pitch');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// Get all contests
router.get('/', async (req, res) => {
  try {
    const contests = await Contest.find()
      .populate('pitches')
      .populate('winnerId')
      .sort({ createdAt: -1 });
    
    const contestsResponse = contests.map(contest => ({
      id: contest._id,
      title: contest.title,
      description: contest.description,
      startDate: contest.startDate,
      endDate: contest.endDate,
      prize: contest.prize,
      status: contest.status,
      pitches: contest.pitches.map(pitch => pitch._id.toString()),
      winnerId: contest.winnerId?._id?.toString(),
      createdAt: contest.createdAt,
      updatedAt: contest.updatedAt
    }));

    res.json(contestsResponse);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get contest by ID
router.get('/:id', async (req, res) => {
  try {
    const contest = await Contest.findById(req.params.id)
      .populate('pitches')
      .populate('winnerId');
    
    if (!contest) {
      return res.status(404).json({ message: 'Contest not found' });
    }

    const contestResponse = {
      id: contest._id,
      title: contest.title,
      description: contest.description,
      startDate: contest.startDate,
      endDate: contest.endDate,
      prize: contest.prize,
      status: contest.status,
      pitches: contest.pitches.map(pitch => pitch._id.toString()),
      winnerId: contest.winnerId?._id?.toString(),
      createdAt: contest.createdAt,
      updatedAt: contest.updatedAt
    };

    res.json(contestResponse);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create contest
router.post('/', [
  auth,
  authorize('admin'),
  body('title').notEmpty().trim(),
  body('description').notEmpty().trim(),
  body('startDate').isISO8601().toDate(),
  body('endDate').isISO8601().toDate(),
  body('prize').notEmpty().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Validate dates
    if (new Date(req.body.startDate) >= new Date(req.body.endDate)) {
      return res.status(400).json({ message: 'End date must be after start date' });
    }

    const contest = new Contest(req.body);
    await contest.save();

    const contestResponse = {
      id: contest._id,
      title: contest.title,
      description: contest.description,
      startDate: contest.startDate,
      endDate: contest.endDate,
      prize: contest.prize,
      status: contest.status,
      pitches: [],
      winnerId: contest.winnerId?.toString(),
      createdAt: contest.createdAt,
      updatedAt: contest.updatedAt
    };

    res.status(201).json(contestResponse);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update contest
router.put('/:id', [
  auth,
  authorize('admin')
], async (req, res) => {
  try {
    const contest = await Contest.findById(req.params.id);
    
    if (!contest) {
      return res.status(404).json({ message: 'Contest not found' });
    }

    // Validate dates if provided
    if (req.body.startDate && req.body.endDate) {
      if (new Date(req.body.startDate) >= new Date(req.body.endDate)) {
        return res.status(400).json({ message: 'End date must be after start date' });
      }
    }

    const updatedContest = await Contest.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    ).populate('pitches').populate('winnerId');

    const contestResponse = {
      id: updatedContest._id,
      title: updatedContest.title,
      description: updatedContest.description,
      startDate: updatedContest.startDate,
      endDate: updatedContest.endDate,
      prize: updatedContest.prize,
      status: updatedContest.status,
      pitches: updatedContest.pitches.map(pitch => pitch._id.toString()),
      winnerId: updatedContest.winnerId?._id?.toString(),
      createdAt: updatedContest.createdAt,
      updatedAt: updatedContest.updatedAt
    };

    res.json(contestResponse);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete contest
router.delete('/:id', [
  auth,
  authorize('admin')
], async (req, res) => {
  try {
    const contest = await Contest.findById(req.params.id);
    
    if (!contest) {
      return res.status(404).json({ message: 'Contest not found' });
    }

    // Remove contest reference from pitches
    await Pitch.updateMany(
      { contestId: req.params.id },
      { $unset: { contestId: 1 } }
    );
    
    // Delete contest
    await Contest.findByIdAndDelete(req.params.id);

    res.json({ message: 'Contest deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Select winner
router.post('/:id/winner', [
  auth,
  authorize('admin'),
  body('pitchId').notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const contest = await Contest.findById(req.params.id);
    if (!contest) {
      return res.status(404).json({ message: 'Contest not found' });
    }

    // Check if pitch exists and is part of this contest
    const pitch = await Pitch.findById(req.body.pitchId);
    if (!pitch) {
      return res.status(404).json({ message: 'Pitch not found' });
    }

    if (!contest.pitches.includes(req.body.pitchId)) {
      return res.status(400).json({ message: 'Pitch is not part of this contest' });
    }

    contest.winnerId = req.body.pitchId;
    contest.status = 'ended';
    await contest.save();

    await contest.populate('pitches');
    await contest.populate('winnerId');

    const contestResponse = {
      id: contest._id,
      title: contest.title,
      description: contest.description,
      startDate: contest.startDate,
      endDate: contest.endDate,
      prize: contest.prize,
      status: contest.status,
      pitches: contest.pitches.map(pitch => pitch._id.toString()),
      winnerId: contest.winnerId._id.toString(),
      createdAt: contest.createdAt,
      updatedAt: contest.updatedAt
    };

    res.json(contestResponse);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add pitch to contest
router.post('/:id/pitches', [
  auth,
  authorize('admin', 'founder'),
  body('pitchId').notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const contest = await Contest.findById(req.params.id);
    if (!contest) {
      return res.status(404).json({ message: 'Contest not found' });
    }

    const pitch = await Pitch.findById(req.body.pitchId);
    if (!pitch) {
      return res.status(404).json({ message: 'Pitch not found' });
    }

    // If user is founder, check if they own the pitch
    if (req.user.role === 'founder' && pitch.founderId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Check if contest is active
    if (contest.status !== 'active') {
      return res.status(400).json({ message: 'Contest is not active' });
    }

    // Check if pitch is already in contest
    if (contest.pitches.includes(req.body.pitchId)) {
      return res.status(400).json({ message: 'Pitch is already in this contest' });
    }

    // Add pitch to contest
    contest.pitches.push(req.body.pitchId);
    await contest.save();

    // Update pitch with contest reference
    pitch.contestId = contest._id;
    await pitch.save();

    await contest.populate('pitches');
    await contest.populate('winnerId');

    const contestResponse = {
      id: contest._id,
      title: contest.title,
      description: contest.description,
      startDate: contest.startDate,
      endDate: contest.endDate,
      prize: contest.prize,
      status: contest.status,
      pitches: contest.pitches.map(pitch => pitch._id.toString()),
      winnerId: contest.winnerId?._id?.toString(),
      createdAt: contest.createdAt,
      updatedAt: contest.updatedAt
    };

    res.json(contestResponse);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;