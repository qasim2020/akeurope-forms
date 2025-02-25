const { ObjectId } = require('mongoose').Types;
const OrphanArabic = require('../models/OrphanArabic');

exports.saveField = async (req, res) => {
    try {
        const { entryId } = req.params;
        const { fieldName, string } = req.body;
        if (!fieldName || !string || !entryId) throw new Error('incomplete fields');

        await OrphanArabic.updateOne(
            { _id: entryId },
            {
                $set: {
                    [fieldName]: string,
                    uploadedBy: {
                        actorType: 'user',
                        actorId: req.session.user._id,
                        actorUrl: `/user/${req.session.user._id}`,
                    },
                },
            },
            { upsert: true },
        );

        res.status(200).send('saved');
    } catch (error) {
        console.log(error);
        res.status(500).send(error.toString());
    }
};
