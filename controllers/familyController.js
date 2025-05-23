const mongoose = require('mongoose');
const FamilyArabic = require('../models/FamilyArabic');
const User = require('../models/User');
const { generateFormFields } = require('../modules/generateFormFields');
const { familyFormTranslation: translations } = require('../modules/translations');
const { saveLog } = require('../modules/logActions');
const { logTemplates } = require('../modules/logTemplates');

exports.newFamily = async (req, res) => {
    try {
        const uploadsCount = await FamilyArabic.countDocuments({ 'uploadedBy.actorId': req.session.user._id });
        if (uploadsCount >= req.session.user.maxUploads)
            throw new Error('You have reached your limit. Please contact admins for changes.');
        const entryId = new mongoose.Types.ObjectId();
        const entry = new FamilyArabic({
            _id: entryId,
            uploadedBy: {
                actorType: 'user',
                actorId: req.session.user._id,
                actorUrl: `/user/${req.session.user._id}`,
            },
        });
        await entry.save();

        await saveLog(logTemplates({
            type: 'formCreated',
            entity: entry,
            actor: req.session.user,
            slug: 'egypt-family',
        }));

        res.redirect(`/get-family/${entryId}`);
    } catch (error) {
        console.log(error);
        res.render('error', {
            layout: 'main',
            error: error.message,
            redirect: '/family'
        });
    }
};

exports.family = async (req, res) => {
    try {
        const entry = await FamilyArabic.findOne({ _id: req.params.entryId, 'uploadedBy.actorId': req.session.user._id }).lean();
        if (!entry) throw new Error('Family data not found');
        const formFields = await generateFormFields(FamilyArabic.schema, entry, true, translations, 'FamilyArabic', entry._id);
        const uploads = await FamilyArabic.find({ 'uploadedBy.actorId': req.session.user._id }).lean();
        res.render('form', {
            layout: 'main',
            data: {
                timestamp: Date.now(),
                uploads,
                formFields,
                rtl: true,
                entryId: entry._id,
                collectionName: 'FamilyArabic',
                projectSlug: 'egypt-family',
                getRoute: 'get-family',
                newRoute: 'new-family',
                remaining: req.session.user.maxUploads - uploads.length > 0 ? req.session.user.maxUploads - uploads.length : 0
            },
        });
    } catch (error) {
        console.log(error);
        res.status(400).render('error', {
            layout: 'main',
            error: error.message,
            redirect: '/family',
        });
    }
};

exports.familyOpen = async (req, res) => {
    try {
        let entry;
        let createNewEntry = false;
        if (req.session?.user) {
            entry = await FamilyArabic.findOne({ 'uploadedBy.actorId': req.session.user._id }).sort({ updatedAt: -1 });
            if (!entry) {
                createNewEntry = true;
            }
        } else {
            const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
            const countryCode = req.headers['cf-ipcountry'] || 'UNKNOWN';
            const ipCountry = `${ip}-${countryCode}`;
            const user = await User.findOneAndUpdate(
                { ipCountry },
                {
                    ipCountry,
                    verified: false
                },
                { upsert: true, new: true }
            );
            req.session.user = user;
            createNewEntry = true;
        }
        if (createNewEntry) {
            const entryId = new mongoose.Types.ObjectId();
            entry = new FamilyArabic({
                _id: entryId,
                uploadedBy: {
                    actorType: 'user',
                    actorId: req.session.user._id,
                    actorUrl: `/user/${req.session.user._id}`,
                },
            });
            await entry.save();
        }

        const formFields = await generateFormFields(FamilyArabic.schema, entry, true, translations, 'FamilyArabic', entry._id);
        res.render('formOpen', {
            layout: 'main',
            data: {
                timestamp: Date.now(),
                formFields,
                rtl: true,
                entryId: entry._id,
                collectionName: 'FamilyArabic',
                projectSlug: 'egypt-family',
            },
        });
    } catch (error) {
        console.log(error);
        res.status(400).render('error', {
            layout: 'main',
            error: error.message,
            redirect: '/family',
        });
    }
}