const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../modules/auth');
const familyController = require('../controllers/familyController');

router.get('/new-family', authenticate, authorize, familyController.newFamily);
router.get('/get-family/:entryId', authenticate, authorize, familyController.family);

module.exports = router;
