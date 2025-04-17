const mongoose = require('mongoose');
const User = require('../models/User');
const OrphanArabic = require('../models/OrphanArabic');
const FamilyArabic = require('../models/FamilyArabic');
const { camelCaseToNormalString } = require('../modules/helpers');

const saveFieldInForm = async(model, fieldName, value, entryId, req) => {

    const schemaField = model.schema.path(fieldName);

    if (!schemaField)
        throw new Error(`Field ${fieldName} does not exist`);

    if (schemaField?.options?.unique) {
        const existing = await model.findOne({ _id: entryId }, { [fieldName]: 1 }).lean();

        if (!existing?.[fieldName]) {
            await model.updateOne(
                { _id: entryId },
                {
                    $set: {
                        [fieldName]: value,
                        uploadedBy: {
                            actorType: 'user',
                            actorId: req.session.user._id,
                            actorUrl: `/user/${req.session.user._id}`,
                        },
                    },
                },
                { upsert: true },
            );
        } else {
            console.log('Unique field already saved so skipping = or if user trying to delete cant delete!!');
        }
    } else {
        await model.updateOne(
            { _id: entryId },
            {
                $set: {
                    [fieldName]: value,
                    uploadedBy: {
                        actorType: 'user',
                        actorId: req.session.user._id,
                        actorUrl: `/user/${req.session.user._id}`,
                    },
                },
            },
            { upsert: true },
        );
    }
}

exports.saveField = async (req, res) => {
    try {
        const { entryId, collectionName } = req.params;
        const { fieldName, string: gotString } = req.body;
        let string;
        if (Array.isArray(gotString)) {
            string = gotString.map(s => s.trim()).filter(s => s); 
        } else if (typeof gotString === 'string') {
            string = gotString.trim();
        }
        if (!fieldName || !string || !entryId || !collectionName) throw new Error('Incomplete fields');
        const model = mongoose.model(collectionName);
        if (!model) throw new Error('Model not found');
        await saveFieldInForm(model, fieldName, string, entryId, req);
        res.status(200).send('saved');
    } catch (error) {
        console.log(error);
        res.status(500).send(error.toString());
    }
};


exports.saveArrayField = async (req, res) => {
    try {
        const { entryId, collectionName } = req.params;
        const { fieldName, files } = req.body;

        if (!Array.isArray(files)) {
            throw new Error('Expected an array of strings');
        }

        if (!fieldName || !entryId || !collectionName) {
            throw new Error('Incomplete fields');
        }

        const model = mongoose.model(collectionName);
        if (!model) throw new Error('Model not found');

        await saveFieldInForm(model, fieldName, files, entryId, req);
        res.status(200).send('saved');;
    } catch (error) {
        console.log(error);
        res.status(500).send(error.toString());
    }
};

exports.validateField = async (req, res) => {
    try {
        const { entryId, collectionName } = req.params;
        const { fieldName, string: gotString } = req.body;
        let string;
        if (Array.isArray(gotString)) {
            string = gotString.map(s => s.trim()).filter(s => s); 
        } else if (typeof gotString === 'string') {
            string = gotString.trim();
        }
        if (!fieldName || !string || !entryId) throw new Error('Incomplete fields');
        const model = mongoose.model(collectionName);
        const existing = await model.findOne({
            [fieldName]: string,
            _id: { $ne: entryId }, 
          }).lean();
        if (existing) {
            const actor = await User.findById(existing.uploadedBy?.actorId).lean()
            throw new Error(`${camelCaseToNormalString(fieldName)}: ${string} is connected with ${actor.phoneNumber} in another form. Therefore can not be added here.`);
        }
        res.status(200).send('Go ahead, save this entry');
    } catch (error) {
        console.log(error);
        res.status(500).send(error.message);
    }
};


exports.deleteFieldValue = async (req, res) => {
    try {
        const { entryId, collectionName } = req.params;
        const { fieldName } = req.body;
        if (!fieldName || !entryId || !collectionName) throw new Error('Incomplete fields');
        const model = mongoose.model(collectionName);
        if (!model) throw new Error('Model not found');
        await saveFieldInForm(model, fieldName, "", entryId, req);
        res.status(200).send('Go ahead, save this entry');
    } catch (error) {
        console.log(error);
        res.status(500).send(error.message);
    }
};