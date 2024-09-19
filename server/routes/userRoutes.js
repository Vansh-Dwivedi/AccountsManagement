const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const roleCheck = require('../middleware/roleCheck');

// Set up multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '..', 'uploads'));
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// Existing routes
router.get('/profile', auth, userController.getProfile);
router.put('/profile', auth, userController.updateProfile);
router.post('/profile-pic', auth, upload.single('profilePic'), userController.uploadProfilePic);
router.delete('/profile-pic', auth, userController.deleteProfilePic);
router.get('/all', auth, userController.getAllUsers);
router.put('/update-role/:userId', auth, roleCheck(['admin']), userController.updateUserRole);
router.put('/:userId/assign-manager', auth, roleCheck(['admin', 'manager']), userController.assignManager);
router.put('/:managerId/assign-client', auth, roleCheck(['admin', 'manager']), userController.assignClient);
router.get('/assigned-clients', auth, roleCheck(['manager']), userController.getAssignedClients);

// Routes for the updated role hierarchy
router.get('/users/role/:role', auth, roleCheck(['admin', 'office_head', 'head_director']), userController.getUsersByRole);
router.get('/role-hierarchy', auth, roleCheck(['admin']), userController.getRoleHierarchy);

// Admin-only routes
router.put('/:userId/block', auth, roleCheck(['admin']), userController.blockUser);
router.put('/:userId/unblock', auth, roleCheck(['admin']), userController.unblockUser);

// New route to fetch all roles
router.get('/roles', auth, userController.getAllRoles);

// New route to delete a user
router.delete('/:userId', auth, roleCheck(['admin']), userController.deleteUser);

module.exports = router;