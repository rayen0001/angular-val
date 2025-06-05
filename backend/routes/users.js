const express = require('express');
const router = express.Router();
const User = require('../models/User'); // Adjust path as needed

// GET /users/count - get total number of users
router.get('/count', async (req, res) => {
  try {
    const userCount = await User.countDocuments();
    res.json({ count: userCount });
  } catch (error) {
    console.error('Error fetching user count:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
