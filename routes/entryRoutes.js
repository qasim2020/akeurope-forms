const express = require('express');
const router = express.Router();
const multer = require('multer');
const { authenticate, authorize } = require('../modules/auth');
const entryController = require('../controllers/entryController');

router.post('/update-field/:collectionName/:entryId', entryController.saveField)
router.post('/delete-field-value/:collectionName/:entryId', authenticate, authorize, entryController.deleteFieldValue)
router.post('/update-array-field/:collectionName/:entryId', entryController.saveArrayField)
router.post('/validate-field/:collectionName/:entryId', entryController.validateField);
router.post('/form-completed/:collectionName/:entryId', entryController.formCompleted);

module.exports = router;