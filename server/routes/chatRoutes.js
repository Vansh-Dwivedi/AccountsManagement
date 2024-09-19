const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const auth = require('../middleware/auth');
const { chatLimiter } = require('../middleware/rateLimiter');

router.get('/conversations', auth, chatController.getConversations);
router.get('/messages/:userId', auth, chatController.getMessages);
router.post('/send', auth, chatLimiter, chatController.sendMessage);
router.post('/submit-to-admin', auth, chatController.sendToAdmin); // Add this line
router.get('/submissions', auth, chatController.getChatSubmissions);
router.put('/submissions/:submissionId', auth, chatController.updateChatSubmissionStatus);
router.get('/sent-remarks', auth, chatController.getSentRemarks);
router.put('/remarks/:remarkId', auth, chatController.updateRemarkStatus);
router.get('/download/:filePath', auth, chatController.downloadFile);

// Add this new route
router.get('/unread-counts/:userId', auth, chatController.getUnreadMessageCounts);

module.exports = router;