const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.get('/', authController.landing);
router.get('/orphan', authController.orphan);
router.get('/family', authController.family)
router.post('/send-code', authController.sendCode);
router.post('/verify-code', authController.verifyCode);
router.get('/logout', authController.logout);

module.exports = router;
