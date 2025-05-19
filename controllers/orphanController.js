const mongoose = require('mongoose');
const GazaOrphan = require('../models/GazaOrphan');
const { generateFormFields } = require('../modules/generateFormFields');
const { orphanFormTranslation: translations } = require('../modules/translations');

// exports.newOrphan = async (req, res) => {
//     try {
//         const uploadsCount = await GazaOrphan.countDocuments({ 'uploadedBy.actorId': req.session.user._id });
//         if (uploadsCount >= req.session.user.maxUploads)
//             throw new Error('You have reached your limit. Please contact admins for changes.');
//         const entryId = new mongoose.Types.ObjectId();
//         const entry = new OrphanArabic({
//             _id: entryId,
//             uploadedBy: {
//                 actorType: 'user',
//                 actorId: req.session.user._id,
//                 actorUrl: `/user/${req.session.user._id}`,
//             },
//         });
//         await entry.save();
//         res.redirect(`/get-orphan/${entryId}`);
//     } catch (error) {
//         res.render('error', {
//             layout: 'main',
//             error: error.message,
//         });
//     }
// };

exports.orphan = async (req, res) => {
    try {
        const entry = await GazaOrphan.findOne({ _id: req.params.entryId }).lean();
        if (!entry)
            throw new Error('No entry found.')
        const formFields = await generateFormFields(GazaOrphan.schema, entry, true, translations, 'GazaOrphan', entry._id);
        const uploads = await GazaOrphan.find({
            $or: [
                { phoneNo1: req.session.user.phoneNumber },
                { phoneNo2: req.session.user.phoneNumber }
            ]
        }).sort({ updatedAt: -1 }).lean()

        res.render('form', {
            layout: 'main',
            data: {
                timestamp: Date.now(),
                uploads,
                formFields,
                rtl: true,
                entryId: entry._id,
                collectionName: 'GazaOrphan',
                projectSlug: 'gaza-orphans',
                getRoute: 'get-orphan',
                newRoute: 'new-orphan',
                hideSubmitBtn: true,
                remaining: req.session.user.maxUploads - uploads.length > 0 ? req.session.user.maxUploads - uploads.length : 0,
                showMultipleEntries: true,
            },
        });
    } catch (error) {
        console.log(error);
        res.render('error', {
            layout: 'main',
            error: error.message,
            redirect: '/orphan',
        });
    }
};