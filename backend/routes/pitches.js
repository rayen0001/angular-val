const express = require('express');
const { body, validationResult } = require('express-validator');
const { Pitch, Vote, Comment } = require('../models/Pitch');
const User = require('../models/User');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// Get all pitches
router.get('/', async (req, res) => {
  try {
    const pitches = await Pitch.find()
      .populate('founderId', 'firstName lastName email')
      .sort({ createdAt: -1 });
    
    // Get votes and comments for each pitch
    const pitchesWithDetails = await Promise.all(
      pitches.map(async (pitch) => {
        const votes = await Vote.find({ pitchId: pitch._id });
        const comments = await Comment.find({ pitchId: pitch._id })
          .populate('investorId', 'firstName lastName');
        
        return {
          id: pitch._id,
          title: pitch.title,
          description: pitch.description,
          problem: pitch.problem,
          solution: pitch.solution,
          market: pitch.market,
          businessModel: pitch.businessModel,
          competition: pitch.competition,
          team: pitch.team,
          financials: pitch.financials,
          fundingAmount: pitch.fundingAmount,
          equity: pitch.equity,
          stage: pitch.stage,
          industry: pitch.industry,
          location: pitch.location,
          founderId: pitch.founderId._id,
          founder: {
            firstName: pitch.founderId.firstName,
            lastName: pitch.founderId.lastName,
            email: pitch.founderId.email
          },
          votes: votes.map(vote => ({
            id: vote._id,
            pitchId: vote.pitchId,
            investorId: vote.investorId,
            score: vote.score,
            createdAt: vote.createdAt
          })),
          comments: comments.map(comment => ({
            id: comment._id,
            pitchId: comment.pitchId,
            investorId: comment.investorId,
            content: comment.content,
            investor: {
              firstName: comment.investorId.firstName,
              lastName: comment.investorId.lastName
            },
            createdAt: comment.createdAt
          })),
          contestId: pitch.contestId,
          createdAt: pitch.createdAt,
          updatedAt: pitch.updatedAt
        };
      })
    );

    res.json(pitchesWithDetails);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get founder's pitches
router.get('/founder', auth, authorize('founder'), async (req, res) => {
  try {
    const pitches = await Pitch.find({ founderId: req.user._id })
      .populate('founderId', 'firstName lastName email')
      .sort({ createdAt: -1 });
    
    const pitchesWithDetails = await Promise.all(
      pitches.map(async (pitch) => {
        const votes = await Vote.find({ pitchId: pitch._id });
        const comments = await Comment.find({ pitchId: pitch._id })
          .populate('investorId', 'firstName lastName');
        
        return {
          id: pitch._id,
          title: pitch.title,
          description: pitch.description,
          problem: pitch.problem,
          solution: pitch.solution,
          market: pitch.market,
          businessModel: pitch.businessModel,
          competition: pitch.competition,
          team: pitch.team,
          financials: pitch.financials,
          fundingAmount: pitch.fundingAmount,
          equity: pitch.equity,
          stage: pitch.stage,
          industry: pitch.industry,
          location: pitch.location,
          founderId: pitch.founderId._id,
          founder: {
            firstName: pitch.founderId.firstName,
            lastName: pitch.founderId.lastName,
            email: pitch.founderId.email
          },
          votes: votes.map(vote => ({
            id: vote._id,
            pitchId: vote.pitchId,
            investorId: vote.investorId,
            score: vote.score,
            createdAt: vote.createdAt
          })),
          comments: comments.map(comment => ({
            id: comment._id,
            pitchId: comment.pitchId,
            investorId: comment.investorId,
            content: comment.content,
            investor: {
              firstName: comment.investorId.firstName,
              lastName: comment.investorId.lastName
            },
            createdAt: comment.createdAt
          })),
          contestId: pitch.contestId,
          createdAt: pitch.createdAt,
          updatedAt: pitch.updatedAt
        };
      })
    );

    res.json(pitchesWithDetails);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get pitch by ID
router.get('/:id', async (req, res) => {
  try {
    const pitch = await Pitch.findById(req.params.id)
      .populate('founderId', 'firstName lastName email');
    
    if (!pitch) {
      return res.status(404).json({ message: 'Pitch not found' });
    }

    const votes = await Vote.find({ pitchId: pitch._id });
    const comments = await Comment.find({ pitchId: pitch._id })
      .populate('investorId', 'firstName lastName');

    const pitchResponse = {
      id: pitch._id,
      title: pitch.title,
      description: pitch.description,
      problem: pitch.problem,
      solution: pitch.solution,
      market: pitch.market,
      businessModel: pitch.businessModel,
      competition: pitch.competition,
      team: pitch.team,
      financials: pitch.financials,
      fundingAmount: pitch.fundingAmount,
      equity: pitch.equity,
      stage: pitch.stage,
      industry: pitch.industry,
      location: pitch.location,
      founderId: pitch.founderId._id,
      founder: {
        firstName: pitch.founderId.firstName,
        lastName: pitch.founderId.lastName,
        email: pitch.founderId.email
      },
      votes: votes.map(vote => ({
        id: vote._id,
        pitchId: vote.pitchId,
        investorId: vote.investorId,
        score: vote.score,
        createdAt: vote.createdAt
      })),
      comments: comments.map(comment => ({
        id: comment._id,
        pitchId: comment.pitchId,
        investorId: comment.investorId,
        content: comment.content,
        investor: {
          firstName: comment.investorId.firstName,
          lastName: comment.investorId.lastName
        },
        createdAt: comment.createdAt
      })),
      contestId: pitch.contestId,
      createdAt: pitch.createdAt,
      updatedAt: pitch.updatedAt
    };

    res.json(pitchResponse);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});


// Create pitch
router.post('/', [
  auth,
  authorize('founder'),
  body('title').notEmpty().trim(),
  body('description').notEmpty().trim(),
  body('problem').notEmpty().trim(),
  body('solution').notEmpty().trim(),
  body('market').notEmpty().trim(),
  body('businessModel').notEmpty().trim(),
  body('competition').notEmpty().trim(),
  body('team').notEmpty().trim(),
  body('financials').notEmpty().trim(),
  body('fundingAmount').isNumeric(),
  body('equity').isNumeric(),
  body('stage').isIn(['idea', 'prototype', 'mvp', 'growth', 'scale']),
  body('industry').notEmpty().trim(),
  body('location').notEmpty().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const pitch = new Pitch({
      ...req.body,
      founderId: req.user._id
    });

    await pitch.save();
    await pitch.populate('founderId', 'firstName lastName email');

    const pitchResponse = {
      id: pitch._id,
      title: pitch.title,
      description: pitch.description,
      problem: pitch.problem,
      solution: pitch.solution,
      market: pitch.market,
      businessModel: pitch.businessModel,
      competition: pitch.competition,
      team: pitch.team,
      financials: pitch.financials,
      fundingAmount: pitch.fundingAmount,
      equity: pitch.equity,
      stage: pitch.stage,
      industry: pitch.industry,
      location: pitch.location,
      founderId: pitch.founderId._id,
      founder: {
        firstName: pitch.founderId.firstName,
        lastName: pitch.founderId.lastName,
        email: pitch.founderId.email
      },
      votes: [],
      comments: [],
      contestId: pitch.contestId,
      createdAt: pitch.createdAt,
      updatedAt: pitch.updatedAt
    };

    res.status(201).json(pitchResponse);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update pitch
router.put('/:id', [
  auth,
  authorize('founder')
], async (req, res) => {
  try {
    const pitch = await Pitch.findById(req.params.id);
    
    if (!pitch) {
      return res.status(404).json({ message: 'Pitch not found' });
    }

    // Check if user owns the pitch
    if (pitch.founderId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const updatedPitch = await Pitch.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    ).populate('founderId', 'firstName lastName email');

    const votes = await Vote.find({ pitchId: updatedPitch._id });
    const comments = await Comment.find({ pitchId: updatedPitch._id })
      .populate('investorId', 'firstName lastName');

    const pitchResponse = {
      id: updatedPitch._id,
      title: updatedPitch.title,
      description: updatedPitch.description,
      problem: updatedPitch.problem,
      solution: updatedPitch.solution,
      market: updatedPitch.market,
      businessModel: updatedPitch.businessModel,
      competition: updatedPitch.competition,
      team: updatedPitch.team,
      financials: updatedPitch.financials,
      fundingAmount: updatedPitch.fundingAmount,
      equity: updatedPitch.equity,
      stage: updatedPitch.stage,
      industry: updatedPitch.industry,
      location: updatedPitch.location,
      founderId: updatedPitch.founderId._id,
      founder: {
        firstName: updatedPitch.founderId.firstName,
        lastName: updatedPitch.founderId.lastName,
        email: updatedPitch.founderId.email
      },
      votes: votes.map(vote => ({
        id: vote._id,
        pitchId: vote.pitchId,
        investorId: vote.investorId,
        score: vote.score,
        createdAt: vote.createdAt
      })),
      comments: comments.map(comment => ({
        id: comment._id,
        pitchId: comment.pitchId,
        investorId: comment.investorId,
        content: comment.content,
        investor: {
          firstName: comment.investorId.firstName,
          lastName: comment.investorId.lastName
        },
        createdAt: comment.createdAt
      })),
      contestId: updatedPitch.contestId,
      createdAt: updatedPitch.createdAt,
      updatedAt: updatedPitch.updatedAt
    };

    res.json(pitchResponse);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete pitch
router.delete('/:id', [
  auth,
  authorize('founder')
], async (req, res) => {
  try {
    const pitch = await Pitch.findById(req.params.id);
    
    if (!pitch) {
      return res.status(404).json({ message: 'Pitch not found' });
    }

    // Check if user owns the pitch
    if (pitch.founderId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Delete associated votes and comments
    await Vote.deleteMany({ pitchId: req.params.id });
    await Comment.deleteMany({ pitchId: req.params.id });
    
    // Delete pitch
    await Pitch.findByIdAndDelete(req.params.id);

    res.json({ message: 'Pitch deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Vote on pitch
router.post('/:id/vote', [
  auth,
  authorize('investor'),
  body('score').isInt({ min: 1, max: 10 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const pitch = await Pitch.findById(req.params.id);
    if (!pitch) {
      return res.status(404).json({ message: 'Pitch not found' });
    }

    // Check if user already voted
    const existingVote = await Vote.findOne({
      pitchId: req.params.id,
      investorId: req.user._id
    });

    if (existingVote) {
      // Update existing vote
      existingVote.score = req.body.score;
      await existingVote.save();
      
      res.json({
        id: existingVote._id,
        pitchId: existingVote.pitchId,
        investorId: existingVote.investorId,
        score: existingVote.score,
        createdAt: existingVote.createdAt
      });
    } else {
      // Create new vote
      const vote = new Vote({
        pitchId: req.params.id,
        investorId: req.user._id,
        score: req.body.score
      });

      await vote.save();

      res.status(201).json({
        id: vote._id,
        pitchId: vote.pitchId,
        investorId: vote.investorId,
        score: vote.score,
        createdAt: vote.createdAt
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Comment on pitch
router.post('/:id/comment', [
  auth,
  authorize('investor'),
  body('content').notEmpty().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const pitch = await Pitch.findById(req.params.id);
    if (!pitch) {
      return res.status(404).json({ message: 'Pitch not found' });
    }

    const comment = new Comment({
      pitchId: req.params.id,
      investorId: req.user._id,
      content: req.body.content
    });

    await comment.save();
    await comment.populate('investorId', 'firstName lastName');

    res.status(201).json({
      id: comment._id,
      pitchId: comment.pitchId,
      investorId: comment.investorId,
      content: comment.content,
      investor: {
        firstName: comment.investorId.firstName,
        lastName: comment.investorId.lastName
      },
      createdAt: comment.createdAt
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get pitch votes
router.get('/:id/votes', async (req, res) => {
  try {
    const votes = await Vote.find({ pitchId: req.params.id });
    
    const votesResponse = votes.map(vote => ({
      id: vote._id,
      pitchId: vote.pitchId,
      investorId: vote.investorId,
      score: vote.score,
      createdAt: vote.createdAt
    }));

    res.json(votesResponse);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get pitch comments
router.get('/:id/comments', async (req, res) => {
  try {
    const comments = await Comment.find({ pitchId: req.params.id })
      .populate('investorId', 'firstName lastName')
      .sort({ createdAt: -1 });
    
    const commentsResponse = comments.map(comment => ({
      id: comment._id,
      pitchId: comment.pitchId,
      investorId: comment.investorId,
      content: comment.content,
      investor: {
        firstName: comment.investorId.firstName,
        lastName: comment.investorId.lastName
      },
      createdAt: comment.createdAt
    }));

    res.json(commentsResponse);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;