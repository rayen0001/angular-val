const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    let token = null;
    
    // Try to get token from Authorization header first
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
    
    // Fallback to cookie if no header token
    if (!token && req.cookies && req.cookies.auth_token) {
      token = req.cookies.auth_token;
    }
    
    if (!token) {
      console.log('Auth middleware: No token provided');
      return res.status(401).json({ message: 'No token provided' });
    }

    console.log('Auth middleware: Token found, verifying...');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      console.log('Auth middleware: User not found for token');
      return res.status(401).json({ message: 'Token is not valid' });
    }

    console.log(`Auth middleware: User authenticated - ${user.firstName} ${user.lastName} (${user.role})`);
    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error.message);
    res.status(401).json({ message: 'Token is not valid' });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      console.log(`Authorization failed: User role ${req.user.role} not in allowed roles [${roles.join(', ')}]`);
      return res.status(403).json({ message: 'Access denied' });
    }
    console.log(`Authorization successful: User role ${req.user.role} is authorized`);
    next();
  };
};

module.exports = { auth, authorize };