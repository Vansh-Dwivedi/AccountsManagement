const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const auth = require('../middleware/auth');
const { validateRegistration, validateLogin, validateForgotPassword, validateResetPassword } = require('../middleware/validate');
const { loginLimiter, forgotPasswordLimiter } = require('../middleware/rateLimiter');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/logout', auth, authController.logout);
router.post('/forgot-password', forgotPasswordLimiter, validateForgotPassword, authController.forgotPassword);
router.post('/reset-password/:resetToken', validateResetPassword, authController.resetPassword);

router.get('/test', (req, res) => {
  res.json({ message: 'Auth routes are working' });
});

// Add this at the end of the file, after other routes
router.use('*', (req, res) => {
  console.log(`Auth route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ error: 'Auth route not found' });
});

module.exports = router;