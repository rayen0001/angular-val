const express = require('express');
const { body, validationResult } = require('express-validator');
const { Pitch, Vote, Comment } = require('../models/Pitch');
const User = require('../models/User');
const { auth, authorize } = require('../middleware/auth');
const sseService = require('../services/sseService');

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
        
        // Count comments by authenticated user if user is logged in
        let userCommentCount = 0;
        if (req.user) {
          userCommentCount = await Comment.countDocuments({ 
            pitchId: pitch._id, 
            investorId: req.user._id 
          });
        }
        
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
          userCommentCount: userCommentCount, // New field
          totalComments: comments.length,
          totalVotes: votes.length,
          averageScore: votes.length > 0 ? (votes.reduce((sum, vote) => sum + vote.score, 0) / votes.length).toFixed(1) : 0,
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
          totalComments: comments.length,
          totalVotes: votes.length,
          averageScore: votes.length > 0 ? (votes.reduce((sum, vote) => sum + vote.score, 0) / votes.length).toFixed(1) : 0,
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

    // Count comments by authenticated user if user is logged in
    let userCommentCount = 0;
    let userVote = null;
    if (req.user) {
      userCommentCount = await Comment.countDocuments({ 
        pitchId: pitch._id, 
        investorId: req.user._id 
      });
      
      userVote = await Vote.findOne({ 
        pitchId: pitch._id, 
        investorId: req.user._id 
      });
    }

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
      userCommentCount: userCommentCount, // New field
      userVote: userVote ? {
        id: userVote._id,
        score: userVote.score,
        createdAt: userVote.createdAt
      } : null, // New field
      totalComments: comments.length,
      totalVotes: votes.length,
      averageScore: votes.length > 0 ? (votes.reduce((sum, vote) => sum + vote.score, 0) / votes.length).toFixed(1) : 0,
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

// Get user's comment statistics across all pitches
router.get('/user/comment-stats', auth, authorize('investor'), async (req, res) => {
  try {
    const totalComments = await Comment.countDocuments({ investorId: req.user._id });
    
    // Get comments grouped by pitch
    const commentsByPitch = await Comment.aggregate([
      { $match: { investorId: req.user._id } },
      { 
        $group: { 
          _id: '$pitchId', 
          count: { $sum: 1 },
          lastCommentDate: { $max: '$createdAt' }
        } 
      },
      { $sort: { lastCommentDate: -1 } }
    ]);

    // Get recent comments
    const recentComments = await Comment.find({ investorId: req.user._id })
      .populate('pitchId', 'title')
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      totalComments,
      pitchesCommentedOn: commentsByPitch.length,
      commentsByPitch: commentsByPitch,
      recentComments: recentComments.map(comment => ({
        id: comment._id,
        content: comment.content,
        pitchTitle: comment.pitchId.title,
        pitchId: comment.pitchId._id,
        createdAt: comment.createdAt
      }))
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user's comments on a specific pitch
router.get('/:id/user-comments', auth, authorize('investor'), async (req, res) => {
  try {
    const comments = await Comment.find({ 
      pitchId: req.params.id, 
      investorId: req.user._id 
    }).sort({ createdAt: -1 });
    
    const commentsResponse = comments.map(comment => ({
      id: comment._id,
      pitchId: comment.pitchId,
      investorId: comment.investorId,
      content: comment.content,
      createdAt: comment.createdAt
    }));

    res.json({
      count: comments.length,
      comments: commentsResponse
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// SSE endpoint for founders to receive notifications
router.get('/notifications/stream', auth, authorize('founder'), (req, res) => {
  // Set SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control, Authorization',
    'Access-Control-Allow-Credentials': 'true'
  });

  // Send initial connection message
  const initialMessage = JSON.stringify({
    type: 'connected',
    message: 'SSE connection established successfully',
    founderId: req.user._id,
    timestamp: new Date().toISOString()
  });

  res.write(`event: connected\n`);
  res.write(`data: ${initialMessage}\n\n`);

  // Add connection to SSE service
  sseService.addConnection(req.user._id, res);

  console.log(`SSE connection established for founder: ${req.user._id} (${req.user.firstName} ${req.user.lastName})`);
});

// Get SSE connection status
router.get('/notifications/status', auth, authorize('founder'), (req, res) => {
  const connectionCount = sseService.getConnectionCount(req.user._id);
  const stats = sseService.getStats();
  
  res.json({
    founderId: req.user._id,
    activeConnections: connectionCount,
    status: connectionCount > 0 ? 'connected' : 'disconnected',
    serverStats: stats
  });
});

// Get SSE server statistics (admin endpoint)
router.get('/notifications/admin/stats', auth, authorize('admin'), (req, res) => {
  const stats = sseService.getStats();
  const connectedFounders = sseService.getConnectedFounders();
  
  res.json({
    ...stats,
    connectedFounders,
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
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
      userCommentCount: 0,
      userVote: null,
      totalComments: 0,
      totalVotes: 0,
      averageScore: 0,
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
      totalComments: comments.length,
      totalVotes: votes.length,
      averageScore: votes.length > 0 ? (votes.reduce((sum, vote) => sum + vote.score, 0) / votes.length).toFixed(1) : 0,
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

    const pitch = await Pitch.findById(req.params.id).populate('founderId', 'firstName lastName');
    if (!pitch) {
      return res.status(404).json({ message: 'Pitch not found' });
    }

    // Get investor details
    const investor = await User.findById(req.user._id).select('firstName lastName');
    if (!investor) {
      return res.status(404).json({ message: 'Investor not found' });
    }

    // Check if user already voted
    const existingVote = await Vote.findOne({
      pitchId: req.params.id,
      investorId: req.user._id
    });

    let voteResponse;
    let isNewVote = false;

    if (existingVote) {
      // Update existing vote
      const oldScore = existingVote.score;
      existingVote.score = req.body.score;
      await existingVote.save();
      
      voteResponse = {
        id: existingVote._id,
        pitchId: existingVote.pitchId,
        investorId: existingVote.investorId,
        score: existingVote.score,
        createdAt: existingVote.createdAt
      };

      // Send SSE notification for vote update
      sseService.sendNotificationToFounder(pitch.founderId._id, 'vote_updated', {
        pitchId: pitch._id,
        pitchTitle: pitch.title,
        vote: voteResponse,
        investor: {
          firstName: investor.firstName,
          lastName: investor.lastName
        },
        oldScore: oldScore,
        newScore: req.body.score,
        message: `${investor.firstName} ${investor.lastName} updated their vote from ${oldScore} to ${req.body.score}`
      });

      console.log(`Vote updated for pitch ${pitch.title} by ${investor.firstName} ${investor.lastName}: ${oldScore} -> ${req.body.score}`);
    } else {
      // Create new vote
      const vote = new Vote({
        pitchId: req.params.id,
        investorId: req.user._id,
        score: req.body.score
      });

      await vote.save();
      isNewVote = true;

      voteResponse = {
        id: vote._id,
        pitchId: vote.pitchId,
        investorId: vote.investorId,
        score: vote.score,
        createdAt: vote.createdAt
      };

      // Send SSE notification for new vote
      sseService.sendNotificationToFounder(pitch.founderId._id, 'new_vote', {
        pitchId: pitch._id,
        pitchTitle: pitch.title,
        vote: voteResponse,
        investor: {
          firstName: investor.firstName,
          lastName: investor.lastName
        },
        message: `${investor.firstName} ${investor.lastName} voted ${req.body.score}/10 on your pitch`
      });

      console.log(`New vote for pitch ${pitch.title} by ${investor.firstName} ${investor.lastName}: ${req.body.score}/10`);
    }

    res.status(isNewVote ? 201 : 200).json(voteResponse);
  } catch (error) {
    console.error('Error in vote endpoint:', error);
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

    const commentResponse = {
      id: comment._id,
      pitchId: comment.pitchId,
      investorId: comment.investorId,
      content: comment.content,
      investor: {
        firstName: comment.investorId.firstName,
        lastName: comment.investorId.lastName
      },
      createdAt: comment.createdAt
    };

    // Send SSE notification for new comment
    sseService.sendNotificationToFounder(pitch.founderId, 'new_comment', {
      pitchId: pitch._id,
      pitchTitle: pitch.title,
      comment: commentResponse,
      message: `${comment.investorId.firstName} ${comment.investorId.lastName} commented on your pitch`
    });

    console.log(`New comment on pitch ${pitch.title} by ${comment.investorId.firstName} ${comment.investorId.lastName}`);

    res.status(201).json(commentResponse);
  } catch (error) {
    console.error('Error in comment endpoint:', error);
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