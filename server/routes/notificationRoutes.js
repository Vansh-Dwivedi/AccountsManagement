const express = require("express");
const router = express.Router();
const Notification = require("../models/Notification");
const { protect } = require("../middleware/authMiddleware");

router.get("/", protect, async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user._id })
      .populate('sender', 'username') // Populate sender field with username
      .sort({ createdAt: -1 })
      .limit(10);
    res.json(notifications);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ message: "Error fetching notifications" });
  }
});

module.exports = router;
