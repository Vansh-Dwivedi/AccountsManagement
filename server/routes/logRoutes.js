const express = require('express');
const router = express.Router();
const logController = require('../controllers/logController');
const auth = require('../middleware/auth');

router.get('/', auth, logController.getLogs);

module.exports = router;