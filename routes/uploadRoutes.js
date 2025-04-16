const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer();
const { uploadFile } = require('../modules/uploadFile');
const { authenticate } = require('../modules/auth');
const uploadController = require('../controllers/uploadController');

router.get('/file/:fileId', authenticate, uploadController.file);
router.get('/file-data/:fileId', authenticate, uploadController.fileData);
router.post('/upload-image', authenticate, upload.single('image'), uploadController.uploadImage);
router.post('/upload-file', authenticate, uploadFile.single('file'), uploadController.uploadFile);
router.post('/delete-file/:fileId', authenticate, uploadController.deleteFile);

module.exports = router;
