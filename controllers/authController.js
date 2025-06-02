require('dotenv').config();
const mongoose = require('mongoose');
const twilio = require('twilio');
const OpenAI = require('openai');
const twilioClient = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const User = require('../models/User');
const GazaOrphan = require('../models/GazaOrphan');
const { isValidEmail, isStrongPassword } = require('../modules/checkValidForm');
const { sendEmail } = require('../modules/sendMail');

const FamilyArabic = require('../models/FamilyArabic');

exports.landing = async (req, res) => {
    return res.render('login');
};

exports.orphan = async (req, res) => {
    if (!req.session.user) return res.render('login', { layout: 'main' });

    const latest = await GazaOrphan.findOne({
        $or: [
            { phoneNo1: req.session.user.phoneNumber },
            { phoneNo2: req.session.user.phoneNumber }
        ]
    }).sort({ updatedAt: -1 });

    if (!latest) return res.status(404).render('error', {
        layout: 'main',
        hideRedirect: true,
        heading: 'Not Found',
        error: `No data found for <br> ${req.session.user.phoneNumber}.`,
    });

    res.redirect(`/get-orphan/${latest._id}`);
};

exports.family = async (req, res) => {
    if (!req.session.user?.verified) return res.render('family', { layout: 'main' });

    const latest = await FamilyArabic.findOne({ 'uploadedBy.actorId': req.session.user._id }).sort({ updatedAt: -1 });

    if (!latest) return res.redirect(`/new-family`);

    res.redirect(`/get-family/${latest._id}`);
};

const getCode = (req) => {
    const EXPIRY = 15 * 60 * 1000;
    const MIN_RESEND_DELAY = 15 * 1000;
    const currentTime = Date.now();

    const previous = req.session.verification;

    if (previous) {
        const age = currentTime - previous.createdAt;

        if (age < MIN_RESEND_DELAY) {
            throw new Error('Please wait a few seconds before requesting a new code.');
        }

        if (age < EXPIRY) {
            return previous.code;
        }
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();

    req.session.verification = {
        code,
        createdAt: currentTime,
    };

    return code;
};

exports.sendCode = async (req, res) => {
    try {
        const { phone } = req.body;
        if (!phone) throw new Error('Phone is required');
        const formattedPhone = phone.replace(/[^+\d]/g, '').replace(/^00/, '+');

        req.session.phone = formattedPhone;
        const code = getCode(req);

        // await twilioClient.messages.create({
        //     body: `Alkhidmat Europe Authentication: \n\n${code} is your verification code. For your security, do not share this code.`,
        //     from: process.env.TWILIO_NO,
        //     to: formattedPhone,
        // });

        await twilioClient.messages.create({
            from: `whatsapp:${process.env.TWILIO_NO}`,
            to: `whatsapp:${formattedPhone}`,
            contentSid: process.env.TWILIO_TEMPLATE_ID,
            contentVariables: JSON.stringify({ 1: code }),
        });

        res.status(200).send('Code sent!');
    } catch (error) {
        console.log(error);
        res.status(400).send(error.message);
    }
};

exports.sendEmailCode = async (req, res) => {
    try {
        const { email: emailReceived } = req.body;
        const email = emailReceived.trim();
        if (!email) throw new Error('Email is required');
        if (!isValidEmail(email))
            throw new Error(`Email ${email} is invalid.`);

        req.session.email = email;
        const code = getCode(req);

        await sendEmail(email, code);

        res.status(200).send('Code sent!');
    } catch (error) {
        console.log(error);
        res.status(400).send(error.message);
    }
};

exports.verifyEmailCode = async (req, res) => {
    try {
        const { code } = req.body;
        const email = req.session.email;

        const verificationCode = req.session.verification?.code;
        if (!verificationCode) throw new Error('Code not found! Generate a new code please');

        if (verificationCode !== code) throw new Error(`Verification code: "${code}", is incorrect.`);
        delete req.session.verificationCode;
        const user = await User.findOneAndUpdate(
            { email },
            { email, verified: true },
            { upsert: true, new: true, lean: true },
        );
        req.session.verified = true;
        req.session.user = user;
        res.status(200).send('verified');
    } catch (error) {
        console.log(error);
        res.status(400).send(error.message);
    }
};

exports.verifyCode = async (req, res) => {
    try {
        const { code, name } = req.body;
        const phone = req.session.phone;

        if (!phone) throw new Error('Phone is required');

        const verificationCode = req.session.verification?.code;
        if (!verificationCode) throw new Error('Code not found! Generate a new code please');

        if (verificationCode !== code) throw new Error('Invalid code. Please make sure that the code is valid.');
        delete req.session.verificationCode;
        const user = await User.findOneAndUpdate(
            { phoneNumber: phone },
            { name, phoneNumber: phone, verified: true },
            { upsert: true, new: true, lean: true },
        );
        req.session.verified = true;
        req.session.user = user;
        res.status(200).send('verified');
    } catch (error) {
        console.log(error);
        res.status(400).send(error.message);
    }
};

exports.logout = async (req, res) => {
    if (req.session.user) {
        req.session.destroy((err) => {
            if (err) console.error(err);
            if (req.query.projectSlug === 'egypt-family') {
                res.redirect('/family');
            } else if (req.query.projectSlug === 'gaza-orphans') {
                res.redirect('/orphan');
            } else {
                throw new Error('Invalid project slug');
            }
        });
    } else {
        res.redirect('/');
    }
};

exports.resetLink = async (req, res) => {
    try {
        const { userId, token } = req.params;
        const user = await User.findOne({
            _id: userId,
        }).lean();
        if (!user || !user.resetPasswordToken) throw new Error(`User not found`);
        const isValid = user.resetPasswordToken === token;
        if (!isValid) {
            throw new Error(`Invalid token for ${user.name}`);
        }
        const isActive = user.resetPasswordExpires > Date.now();
        if (!isActive) {
            throw new Error(`Token expired for ${user.name} - please generate a new token.`);
        }
        res.status(200).render('register', {
            data: {
                name: user.name,
                phoneNumber: user.phoneNumber,
                userId,
                token
            }
        });
    } catch (error) {
        console.error(error);
        res.status(400).render('error', {
            error: error.message || 'Server error',
            heading: 'Authentication failed',
            redirect: '/'
        });
    }
}

exports.registerUser = async (req, res) => {
    try {
        const { password } = req.body;
        if (!isStrongPassword(password)) {
            console.log(password);
            console.log(isStrongPassword(password))
            throw new Error('Minimum 8 characters, at least one uppercase letter, one lowercase letter, one number, and one special character')
        }
        const { userId, token } = req.params;
        const user = await User.findOne({
            _id: userId,
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() },
        });
        if (!user) throw new Error(`User not found`);
        if (user.password) {
            throw new Error('Password is already set.')
        }
        user.verified = true;
        user.password = password;
        await user.save();
        const slug = user.projects[0];
        if (slug === 'gaza-orphans') {
            res.status(200).send('User registered');
        } else {
            res.status(400).send(`Project ${slug} is not supported`);
        }
    } catch (error) {
        console.error(error);
        res.status(400).send(error.message || 'Server error = check please');
    }
}

exports.login = async (req, res) => {
    try {
        const { phoneNumber, password } = req.body;
        let user = await User.findOne({ phoneNumber });

        if (!user) throw new Error(`User with phone number: ${phoneNumber} was not found.`)

        user = await User.findOne({ phoneNumber: phoneNumber, password: { $exists: true } });

        if (!user) throw new Error('You have not yet created a password. Please use the reset-password link provided by alkhidmat europe to create a password.')

        const loginCondition = process.env.ENV === 'testtest' ?
            user :
            user && (await user.comparePassword(password));
        if (loginCondition) {
            if (user.status === 'blocked') {
                return res.status(400).send('User is blocked. Please contact akeurope team to resolve the issue.');
            }
            req.session.user = user;
            req.session.cookie.maxAge = 1000 * 60 * 60 * 24 * 30;
            const slug = user.projects[0];
            if (slug === 'gaza-orphans') {
                res.status(200).send('orphan');
            } else {
                res.status(400).send(`Project ${slug} is not supported`);
            }
        } else {
            res.status(400).send(`Password mismatch for phone number: ${user.phoneNumber}. Please reach out to us to get a new password link.`);
        }
    } catch (error) {
        console.log(error);
        res.status(400).send(error.message || 'Server Error');
    }
};