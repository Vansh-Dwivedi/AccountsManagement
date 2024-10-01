const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const Message = require('../models/Message');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/')
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname))
  }
});

const upload = multer({ storage: storage });

router.get('/messages/:chatId', auth, chatController.getMessages);
router.post('/send', auth, upload.single('file'), chatController.sendMessage);
router.get('/search', async (req, res) => {
  try {
    const { chatId, keyword, startDate, endDate, fileType } = req.query;

    let query = { chatId };

    if (keyword) {
      query.$or = [
        { content: { $regex: keyword, $options: 'i' } },
        { 'file.originalName': { $regex: keyword, $options: 'i' } }
      ];
    }

    if (startDate && endDate) {
      query.timestamp = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    if (fileType && fileType !== 'All') {
      query.fileType = fileType;
    }

    const messages = await Message.find(query)
      .populate('sender', 'username')
      .sort({ timestamp: -1 });

    res.json({ messages });
  } catch (error) {
    console.error('Error in chat search:', error);
    res.status(500).json({ error: 'An error occurred while searching messages' });
  }
});

module.exports = router;

module.exports = router;