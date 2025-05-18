const mongoose = require('mongoose');
const OrphanArabic = require('../models/OrphanArabic');
const FamilyArabic = require('../models/FamilyArabic');
const { generateFormFields } = require('../modules/generateFormFields');
const { familyFormTranslation: translations} = require('../modules/translations');
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
        });
    }
};

exports.family = async (req, res) => {
    try {
        const entry = await FamilyArabic.findOne({_id: req.params.entryId, 'uploadedBy.actorId': req.session.user._id}).lean();
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
        });
    }
};