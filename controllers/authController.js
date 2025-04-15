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

    const latest = await OrphanArabic.findOne({ 'uploadedBy.actorId': req.session.user._id })
        .sort({ updatedAt: -1 });

    if (!latest) return res.redirect(`/new-orphan`);

    res.redirect(`/get-orphan/${latest._id}`);
};

exports.family = async (req, res) => {
    if (!req.session.user) return res.render('family', { layout: 'main' });

    const latest = await FamilyArabic.findOne({ 'uploadedBy.actorId': req.session.user._id })
        .sort({ updatedAt: -1 });

    if (!latest) return res.redirect(`/new-family`);

    res.redirect(`/get-family/${latest._id}`);
};

exports.sendCode = async (req, res) => {
    try {
        const { phone } = req.body;
        if (!phone) throw new Error('Phone is required');

        const formattedPhone = phone.trim().replace(/\s+/g, '');
        req.session.phone = formattedPhone;
        
        await twilioClient.verify.v2.services(process.env.TWILIO_VERIFY_SID)
            .verifications.create({
                to: formattedPhone,
                channel: 'sms'
            });

        // await client.messages.create({
        //     from: 'whatsapp:+14155238886', // Twilio sandbox or approved WhatsApp number
        //     to: `whatsapp:${formattedPhone}`, // Make sure this is in E.164 format
        //     contentSid: 'HX229f5a04fd0510ce1b071852155d3e75', // Your approved WhatsApp template SID
        //     contentVariables: JSON.stringify({ '1': '409173' }) // Replace with dynamic code or variables
        // });

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

        const verification = await twilioClient.verify.v2
            .services(process.env.TWILIO_VERIFY_SID)
            .verificationChecks.create({ to: phone, code });

        if (verification.status === 'approved') {
            const user = await User.findOneAndUpdate(
                { phoneNumber: phone },
                { name, phoneNumber: phone, verified: true, maxUploads: 10 },
                { upsert: true, new: true, lean: true },
            );
            req.session.verified = true;
            req.session.user = user;
            res.status(200).send('verified');
        } else {
            res.status(300).send('Invalid code, try again');
        }
    } catch (error) {
        console.log(error);
        res.status(error.status).send(error.message);
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
