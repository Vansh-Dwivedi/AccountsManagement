const Chat = require('../models/Chat');
const User = require('../models/User');
const ChatSubmission = require('../models/ChatSubmission');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Message = require('../models/Message');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/')
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname))
  }
});

const upload = multer({ storage: storage }).single('file');

exports.sendMessage = (req, res) => {
  upload(req, res, async function (err) {
    if (err) {
      console.error('Upload error:', err);
      return res.status(400).json({ error: err.message });
    }

    try {
      console.log('Received message request:', req.body);
      console.log('Received file:', req.file);
      const { message, receiverId } = req.body;
      if (!message || !receiverId) {
        console.error('Missing required fields:', { message, receiverId });
        return res.status(400).json({ error: 'Message and receiverId are required' });
      }

      let fileData;
      if (req.file) {
        fileData = {
          filename: req.file.originalname,
          path: req.file.path
        };
      }

      const chat = new Chat({
        sender: req.user.id,
        receiver: receiverId,
        message,
        file: fileData
      });

      await chat.save();
      
      console.log('Message saved:', chat);
      
      // Emit the message to both the sender and receiver
      const io = req.app.get('io');
      io.to(receiverId).emit('message', chat);
      io.to(req.user.id).emit('message', chat);

      res.status(201).json(chat);
    } catch (error) {
      console.error('Error in sendMessage:', error);
      if (error.name === 'ValidationError') {
        return res.status(400).json({ error: error.message });
      }
      res.status(500).json({ error: 'An unexpected error occurred' });
    }
  });
};

exports.getMessages = async (req, res) => {
  try {
    const { userId } = req.params;
    const messages = await Chat.find({
      $or: [
        { sender: req.user.id, receiver: userId },
        { sender: userId, receiver: req.user.id }
      ]
    }).sort('timestamp');
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.submitToAdmin = async (req, res) => {
  try {
    const { clientId, managerId, remarks } = req.body;
    const admin = await User.findOne({ role: 'admin' });
    if (!admin) {
      return res.status(404).json({ error: 'Admin not found' });
    }

    const chatLog = await Chat.find({
      $or: [
        { sender: clientId, receiver: managerId },
        { sender: managerId, receiver: clientId }
      ]
    }).sort('timestamp');

    const submission = {
      clientId,
      managerId,
      remarks,
      chatLog,
      submittedAt: new Date()
    };

    // Here you would typically save this submission to a new collection
    // For now, we'll just send a notification to the admin
    req.app.get('io').to(admin._id.toString()).emit('chatSubmission', submission);

    res.json({ message: 'Chat submitted to admin successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getConversations = async (req, res) => {
  try {
    const userId = req.user.id;
    console.log('Fetching conversations for user:', userId);
    const conversations = await Chat.aggregate([
      {
        $match: {
          $or: [{ sender: userId }, { receiver: userId }]
        }
      },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ['$sender', userId] },
              '$receiver',
              '$sender'
            ]
          },
          lastMessage: { $last: '$$ROOT' }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'userDetails'
        }
      },
      {
        $unwind: '$userDetails'
      },
      {
        $project: {
          _id: 1,
          username: '$userDetails.username',
          lastMessage: 1
        }
      }
    ]);
    console.log('Conversations found:', conversations);
    res.json(conversations);
  } catch (error) {
    console.error('Error in getConversations:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.sendToAdmin = async (req, res) => {
  try {
    const { clientId, managerId, remarks } = req.body;
    const admin = await User.findOne({ role: 'admin' });
    if (!admin) {
      return res.status(404).json({ error: 'Admin not found' });
    }

    const chatLog = await Chat.find({
      $or: [
        { sender: clientId, receiver: managerId },
        { sender: managerId, receiver: clientId }
      ]
    }).sort('timestamp').populate('sender', 'username').populate('receiver', 'username');

    const submission = new ChatSubmission({
      clientId,
      managerId,
      remarks,
      chatLog: chatLog.map(chat => chat._id),
      submittedAt: new Date()
    });

    await submission.save();

    // Notify admin (you can implement a real-time notification system later)
    console.log('Chat submitted to admin:', submission);

    res.json({ message: 'Chat submitted to admin successfully' });
  } catch (error) {
    console.error('Error in sendToAdmin:', error);
    res.status(500).json({ error: 'An unexpected error occurred' });
  }
};

exports.getChatSubmissions = async (req, res) => {
  try {
    const submissions = await ChatSubmission.find()
      .populate('clientId', 'username')
      .populate('managerId', 'username')
      .sort('-submittedAt');
    res.json(submissions);
  } catch (error) {
    console.error('Error fetching chat submissions:', error);
    res.status(500).json({ error: 'An unexpected error occurred' });
  }
};

exports.updateChatSubmissionStatus = async (req, res) => {
  try {
    const { submissionId } = req.params;
    const { status } = req.body;
    const submission = await ChatSubmission.findByIdAndUpdate(
      submissionId,
      { status },
      { new: true }
    );
    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }
    res.json(submission);
  } catch (error) {
    console.error('Error updating chat submission status:', error);
    res.status(500).json({ error: 'An unexpected error occurred' });
  }
};

exports.getSentRemarks = async (req, res) => {
  try {
    const remarks = await ChatSubmission.find({ managerId: req.user.id })
      .populate('clientId', 'username')
      .sort('-submittedAt');
    res.json(remarks);
  } catch (error) {
    console.error('Error fetching sent remarks:', error);
    res.status(500).json({ error: 'An unexpected error occurred' });
  }
};

exports.updateRemarkStatus = async (req, res) => {
  try {
    const { remarkId } = req.params;
    const { status } = req.body;
    const remark = await ChatSubmission.findByIdAndUpdate(
      remarkId,
      { status },
      { new: true }
    );
    if (!remark) {
      return res.status(404).json({ error: 'Remark not found' });
    }
    res.json(remark);
  } catch (error) {
    console.error('Error updating remark status:', error);
    res.status(500).json({ error: 'An unexpected error occurred' });
  }
};

exports.downloadFile = (req, res) => {
  const filePath = path.join(__dirname, '..', req.params.filePath);
  console.log('Requested file path:', filePath);
  
  if (fs.existsSync(filePath)) {
    const filename = path.basename(filePath);
    console.log('Sending file:', filename);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.download(filePath, filename, (err) => {
      if (err) {
        console.error('Error sending file:', err);
        res.status(500).send('Error downloading file');
      }
    });
  } else {
    console.error('File not found:', filePath);
    res.status(404).json({ error: 'File not found' });
  }
};

exports.getUnreadMessageCounts = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const unreadCounts = await Message.aggregate([
      { $match: { receiver: userId, read: false } },
      { $group: { _id: '$sender', count: { $sum: 1 } } }
    ]);
    
    const countsObject = unreadCounts.reduce((acc, curr) => {
      acc[curr._id] = curr.count;
      return acc;
    }, {});
    
    res.json(countsObject);
  } catch (error) {
    console.error('Error fetching unread counts:', error);
    res.status(500).json({ message: 'Error fetching unread counts' });
  }
};