const Message = require("../models/Message");
const User = require("../models/User");
const ChatSubmission = require("../models/ChatSubmission");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const Notification = require("../models/Notification");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage }).single("file");

exports.sendMessage = async (req, res) => {
  try {
    const { receiver, message, fileType } = req.body;
    const sender = req.user.id; // This should be the authenticated user's ID

    console.log(`Sending message from ${sender} to ${receiver}`);

    if (!receiver || !message) {
      return res
        .status(400)
        .json({ error: "Receiver and message are required" });
    }

    let file;
    if (req.file) {
      file = {
        filename: req.file.filename,
        originalName: req.file.originalname,
        path: req.file.path,
      };
    }

    // Create and save the message
    const newMessage = new Message({
      sender,
      receiver,
      content: message,
      file,
      fileType,
    });

    await newMessage.save();

    // Populate sender information
    await newMessage.populate("sender", "username profilePic");

    // Fetch the sender's user information
    const senderUser = await User.findById(sender);

    // Create and save the notification
    const newNotification = new Notification({
      userId: receiver,
      sender: sender, // Set the sender field to the authenticated user's ID
      message: `${senderUser.username}`,
      senderProfilePic: senderUser.profilePic || "default-profile-pic.jpg",
      createdAt: new Date(),
    });

    await newNotification.save();

    console.log(`Emitting newNotification to ${receiver}`);
    req.app.get("io").to(receiver.toString()).emit("newMessage", newMessage);
    req.app
      .get("io")
      .to(receiver.toString())
      .emit("newNotification", newNotification);

    res.status(201).json(newMessage);
  } catch (error) {
    console.error("Error in sendMessage:", error);
    res.status(500).json({ error: "Server error" });
  }
};

exports.getMessages = async (req, res) => {
  try {
    const { chatId } = req.params;
    console.log('Received chatId:', chatId); // Debug log

    if (!chatId || chatId === 'undefined' || !chatId.includes('-')) {
      return res.status(400).json({ error: 'Invalid chat ID' });
    }

    const [user1, user2] = chatId.split('-');
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    if (!user1 || !user2) {
      return res.status(400).json({ error: 'Invalid chat ID format' });
    }

    console.log('Querying messages for users:', user1, user2); // Debug log

    const messages = await Message.find({
      $or: [
        { sender: user1, receiver: user2 },
        { sender: user2, receiver: user1 },
      ],
    })
      .sort({ timestamp: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("sender", "username profilePic")
      .populate("receiver", "username profilePic");

    const totalMessages = await Message.countDocuments({
      $or: [
        { sender: user1, receiver: user2 },
        { sender: user2, receiver: user1 },
      ],
    });

    res.json({
      messages: messages.reverse(),
      currentPage: page,
      totalPages: Math.ceil(totalMessages / limit),
      totalMessages,
    });
  } catch (error) {
    console.error("Error in getMessages:", error);
    res.status(500).json({ error: "Server error", details: error.message });
  }
};

exports.getConversations = async (req, res) => {
  try {
    const userId = req.user.id;
    const conversations = await Message.aggregate([
      {
        $match: {
          $or: [{ sender: userId }, { receiver: userId }],
        },
      },
      {
        $sort: { timestamp: -1 },
      },
      {
        $group: {
          _id: {
            $cond: [{ $eq: ["$sender", userId] }, "$receiver", "$sender"],
          },
          lastMessage: { $first: "$$ROOT" },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "userDetails",
        },
      },
      {
        $unwind: "$userDetails",
      },
      {
        $project: {
          _id: 1,
          username: "$userDetails.username",
          lastMessage: 1,
        },
      },
    ]);
    res.json(conversations);
  } catch (error) {
    console.error("Error in getConversations:", error);
    res.status(500).json({ error: error.message });
  }
};

exports.submitToAdmin = async (req, res) => {
  try {
    const { clientId, managerId, remarks } = req.body;
    const admin = await User.findOne({ role: "admin" });
    if (!admin) {
      return res.status(404).json({ error: "Admin not found" });
    }

    const chatLog = await Message.find({
      $or: [
        { sender: clientId, receiver: managerId },
        { sender: managerId, receiver: clientId },
      ],
    }).sort("timestamp");

    const submission = {
      clientId,
      managerId,
      remarks,
      chatLog,
      submittedAt: new Date(),
    };

    // Here you would typically save this submission to a new collection
    // For now, we'll just send a notification to the admin
    req.app
      .get("io")
      .to(admin._id.toString())
      .emit("chatSubmission", submission);

    res.json({ message: "Chat submitted to admin successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.sendToAdmin = async (req, res) => {
  try {
    const { clientId, managerId, remarks } = req.body;
    const admin = await User.findOne({ role: "admin" });
    if (!admin) {
      return res.status(404).json({ error: "Admin not found" });
    }

    const chatLog = await Message.find({
      $or: [
        { sender: clientId, receiver: managerId },
        { sender: managerId, receiver: clientId },
      ],
    })
      .sort("timestamp")
      .populate("sender", "username")
      .populate("receiver", "username");

    const submission = new ChatSubmission({
      clientId,
      managerId,
      remarks,
      chatLog: chatLog.map((chat) => chat._id),
      submittedAt: new Date(),
    });

    await submission.save();

    // Notify admin (you can implement a real-time notification system later)
    console.log("Chat submitted to admin:", submission);

    res.json({ message: "Chat submitted to admin successfully" });
  } catch (error) {
    console.error("Error in sendToAdmin:", error);
    res.status(500).json({ error: "An unexpected error occurred" });
  }
};

exports.getChatSubmissions = async (req, res) => {
  try {
    const submissions = await ChatSubmission.find()
      .populate("clientId", "username")
      .populate("managerId", "username")
      .sort("-submittedAt");
    res.json(submissions);
  } catch (error) {
    console.error("Error fetching chat submissions:", error);
    res.status(500).json({ error: "An unexpected error occurred" });
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
      return res.status(404).json({ error: "Submission not found" });
    }
    res.json(submission);
  } catch (error) {
    console.error("Error updating chat submission status:", error);
    res.status(500).json({ error: "An unexpected error occurred" });
  }
};

exports.getSentRemarks = async (req, res) => {
  try {
    const remarks = await ChatSubmission.find({ managerId: req.user.id })
      .populate("clientId", "username")
      .sort("-submittedAt");
    res.json(remarks);
  } catch (error) {
    console.error("Error fetching sent remarks:", error);
    res.status(500).json({ error: "An unexpected error occurred" });
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
      return res.status(404).json({ error: "Remark not found" });
    }
    res.json(remark);
  } catch (error) {
    console.error("Error updating remark status:", error);
    res.status(500).json({ error: "An unexpected error occurred" });
  }
};

exports.downloadFile = (req, res) => {
  const filePath = path.join(__dirname, "..", req.params.filePath);
  console.log("Requested file path:", filePath);

  if (fs.existsSync(filePath)) {
    const filename = path.basename(filePath);
    console.log("Sending file:", filename);
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.download(filePath, filename, (err) => {
      if (err) {
        console.error("Error sending file:", err);
        res.status(500).send("Error downloading file");
      }
    });
  } else {
    console.error("File not found:", filePath);
    res.status(404).json({ error: "File not found" });
  }
};

exports.getUnreadMessageCounts = async (req, res) => {
  try {
    const { userId } = req.params;

    const unreadCounts = await Message.aggregate([
      { $match: { receiver: userId, read: false } },
      { $group: { _id: "$sender", count: { $sum: 1 } } },
    ]);

    const countsObject = unreadCounts.reduce((acc, curr) => {
      acc[curr._id] = curr.count;
      return acc;
    }, {});

    res.json(countsObject);
  } catch (error) {
    console.error("Error fetching unread counts:", error);
    res.status(500).json({ message: "Error fetching unread counts" });
  }
};

exports.markMessageAsRead = async (req, res) => {
  try {
    const { messageId } = req.params;
    const message = await Message.findByIdAndUpdate(
      messageId,
      { read: true },
      { new: true }
    );
    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }
    res.json(message);
  } catch (error) {
    console.error("Error marking message as read:", error);
    res.status(500).json({ error: "An unexpected error occurred" });
  }
};