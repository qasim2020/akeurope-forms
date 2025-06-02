const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const familyController = require('../controllers/familyController');

router.get('/', authController.landing);
router.get('/orphan', authController.orphan);
// router.get('/family', authController.family)
// router.get('/family-test', familyController.familyOpen)
router.post('/send-code', authController.sendCode);
router.post('/verify-code', authController.verifyCode);
router.get('/logout', authController.logout);

// router.post('/send-email-code', authController.sendEmailCode);
// router.post('/verify-email-code', authController.verifyEmailCode);

router.get('/resetlink/:userId/:token', authController.resetLink);
router.post('/register-user/:userId/:token', authController.registerUser);
router.get('/login', (req, res) => res.render('login'));
router.post('/login', authController.login);

module.exports = router;
