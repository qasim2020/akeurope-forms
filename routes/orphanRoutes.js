const express = require('express');
const router = express.Router();
const { authenticate } = require('../modules/auth');
const orphanController = require('../controllers/orphanController');

router.get('/new-orphan', authenticate, orphanController.newOrphan);
router.get('/get-orphan/:entryId', authenticate, orphanController.orphan);

module.exports = router;
