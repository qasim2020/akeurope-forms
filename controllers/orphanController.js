const mongoose = require('mongoose');
const OrphanArabic = require('../models/OrphanArabic');
const { generateFormFields } = require('../modules/generateFormFields');
const { orphanFormTranslation: translations } = require('../modules/translations');

exports.newOrphan = async (req, res) => {
    try {
        const uploadsCount = await OrphanArabic.countDocuments({ 'uploadedBy.actorId': req.session.user._id });
        if (uploadsCount >= req.session.user.maxUploads)
            throw new Error('You have reached your limit. Please contact admins for changes.');
        const entryId = new mongoose.Types.ObjectId();
        const entry = new OrphanArabic({
            _id: entryId,
            uploadedBy: {
                actorType: 'user',
                actorId: req.session.user._id,
                actorUrl: `/user/${req.session.user._id}`,
            },
        });
        await entry.save();
        res.redirect(`/get-orphan/${entryId}`);
    } catch (error) {
        res.render('error', {
            layout: 'main',
            error: error.message,
        });
    }
};

exports.orphan = async (req, res) => {
    try {
        const entry = await OrphanArabic.findById(req.params.entryId).lean();
        const formFields = await generateFormFields(OrphanArabic.schema, entry, true, translations);
        const uploads = await OrphanArabic.find({ 'uploadedBy.actorId': req.session.user._id }).lean();
        res.render('orphanForm', {
            layout: 'main',
            data: {
                uploads,
                formFields,
                rtl: true,
                entryId: entry._id,
                remaining: req.session.user.maxUploads - uploads.length
            },
        });
    } catch (error) {
        res.render('error', {
            layout: 'main',
            error: error.message,
        });
    }
};