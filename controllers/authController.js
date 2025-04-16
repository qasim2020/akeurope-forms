require('dotenv').config();
const mongoose = require('mongoose');
const twilio = require('twilio');
const OpenAI = require('openai');
const twilioClient = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const User = require('../models/User');
const OrphanArabic = require('../models/OrphanArabic');
const FamilyArabic = require('../models/FamilyArabic');

exports.landing = async (req, res) => {
    return res.redirect('/family');
};

exports.orphan = async (req, res) => {
    if (!req.session.user) return res.render('orphan', { layout: 'main' });

    const latest = await OrphanArabic.findOne({ 'uploadedBy.actorId': req.session.user._id }).sort({ updatedAt: -1 });

    if (!latest) return res.redirect(`/new-orphan`);

    res.redirect(`/get-orphan/${latest._id}`);
};

exports.family = async (req, res) => {
    if (!req.session.user) return res.render('family', { layout: 'main' });

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

        await twilioClient.messages.create({
            body: `Alkhidmat Europe Authentication: \n\n${code} is your verification code. For your security, do not share this code.`,
            from: process.env.TWILIO_NO,
            to: formattedPhone,
        });

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
            res.redirect('/');
        });
    } else {
        res.redirect('/');
    }
};
