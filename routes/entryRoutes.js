const express = require('express');
const router = express.Router();
const multer = require('multer');
const { authenticate } = require('../modules/auth');
const entryController = require('../controllers/entryController');

router.post('/save-field/:entryId', authenticate, entryController.saveField);

module.exports = router;
