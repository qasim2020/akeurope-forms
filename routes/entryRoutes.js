const express = require('express');
const router = express.Router();
const multer = require('multer');
const { authenticate } = require('../modules/auth');
const entryController = require('../controllers/entryController');

router.post('/update-orphan-field/:entryId', authenticate, entryController.saveOrphanField);
router.post('/update-family-field/:entryId', authenticate, entryController.saveFamilyField);
router.post('/validate-family-field/:entryId', authenticate, entryController.validateFamilyField);
router.post('/validate-orphan-field/:entryId', authenticate, entryController.validateOrphanField);

module.exports = router;
