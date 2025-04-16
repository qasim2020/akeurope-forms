const mongoose = require('mongoose');
const OrphanArabic = require('../models/OrphanArabic');
const FamilyArabic = require('../models/FamilyArabic');
const { generateFormFields } = require('../modules/generateFormFields');
const { familyFormTranslation: translations} = require('../modules/translations');

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
        res.redirect(`/get-family/${entryId}`);
    } catch (error) {
        console.log(error);
        res.render('error', {
            layout: 'main',
            error: error.message,
        });
    }
};

exports.family = async (req, res) => {
    try {
        const entry = await FamilyArabic.findById(req.params.entryId).lean();
        if (!entry) throw new Error('Family data not found');
        const formFields = await generateFormFields(FamilyArabic.schema, entry, true, translations);
        const uploads = await FamilyArabic.find({ 'uploadedBy.actorId': req.session.user._id }).lean();
        res.render('familyForm', {
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
        console.log(error);
        res.status(400).render('error', {
            layout: 'main',
            error: error.message,
        });
    }
};