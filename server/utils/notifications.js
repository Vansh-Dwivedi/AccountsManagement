const Notification = require('../models/Notification'); // You'll need to create this model

exports.sendNotificationToAdmins = async (adminUsers, message, data) => {
  try {
    const notifications = adminUsers.map(admin => ({
      userId: admin._id,
      message,
      data
    }));
    await Notification.insertMany(notifications);
    // If you're using real-time notifications (e.g., with Socket.io), emit an event here
  } catch (error) {
    console.error('Error sending notifications:', error);
  }
};