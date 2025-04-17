const express = require('express');
const router = express.Router();
const multer = require('multer');
const { authenticate, authorize } = require('../modules/auth');
const entryController = require('../controllers/entryController');

router.post('/update-field/:collectionName/:entryId', authenticate, authorize, entryController.saveField)
router.post('/delete-field-value/:collectionName/:entryId', authenticate, authorize, entryController.deleteFieldValue)
router.post('/update-array-field/:collectionName/:entryId', authenticate, authorize, entryController.saveArrayField)
router.post('/validate-field/:collectionName/:entryId', authenticate, authorize, entryController.validateField);

module.exports = router;
