const express = require('express');
const router = express.Router();
const clientController = require('../controllers/clientController');
const auth = require('../middleware/auth');

router.post('/client-info', auth, clientController.submitClientInfo);

module.exports = router;