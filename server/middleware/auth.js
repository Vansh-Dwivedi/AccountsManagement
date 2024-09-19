const jwt = require('jsonwebtoken');

module.exports = function(req, res, next) {
  console.log('Auth middleware called'); // Add this line
  console.log('Headers:', req.headers); // Add this line

  // Get token from header
  const token = req.header('Authorization')?.split(' ')[1];
  console.log('Extracted token:', token); // Add this line

  // Check if no token
  if (!token) {
    console.log('No token found'); // Add this line
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Decoded token:', decoded); // Add this line
    req.user = decoded.user;
    next();
  } catch (err) {
    console.error('Token verification error:', err); // Add this line
    res.status(401).json({ msg: 'Token is not valid' });
  }
};