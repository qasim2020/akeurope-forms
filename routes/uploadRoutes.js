const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer();
const { uploadFile } = require('../modules/uploadFile');
const { authenticate, authorize } = require('../modules/auth');
const uploadController = require('../controllers/uploadController');

router.get('/file/:collectionName/:entryId/:fileId', authenticate, authorize, uploadController.file);
router.get('/file-data/:collectionName/:entryId/:fileId', authenticate, authorize, uploadController.fileData);
router.post('/upload-image/:collectionName/:entryId', authenticate, authorize, upload.single('image'), uploadController.uploadImage);
router.post('/upload-file/:collectionName/:entryId', authenticate, authorize, uploadFile.single('file'), uploadController.uploadFile);
router.post('/delete-file/:collectionName/:entryId/:fileId/:fieldName', authenticate, authorize, uploadController.deleteFile);

module.exports = router;