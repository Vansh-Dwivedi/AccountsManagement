const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    console.log('No token provided');
    return res.status(401).json({ message: 'Not authorized to access this route' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Decoded token:', decoded);
    req.user = await User.findById(decoded.id || decoded.user.id).select('-password');
    if (!req.user) {
      console.log('User not found with id:', decoded.id || decoded.user.id);
      return res.status(401).json({ message: 'User not found' });
    }
    console.log('User found:', req.user);
    next();
  } catch (error) {
    console.error('Error in protect middleware:', error);
    return res.status(401).json({ message: 'Not authorized to access this route' });
  }
};

exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'User not found' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'User role is not authorized to access this route' });
    }
    next();
  };
};