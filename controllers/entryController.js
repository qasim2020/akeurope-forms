const OrphanArabic = require('../models/OrphanArabic');
const FamilyArabic = require('../models/FamilyArabic');
const { camelCaseToNormalString } = require('../modules/helpers');

const saveFieldInForm = async(model, fieldName, string, entryId, req) => {

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
        } else {
            console.log('Unique field already saved so skipping!');
        }
    } else {
        await model.updateOne(
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
    }
}

exports.saveOrphanField = async (req, res) => {
    try {
        const { entryId } = req.params;
        const { fieldName, string: gotString } = req.body;
        const string = gotString.trim();
        if (!fieldName || !string || !entryId) throw new Error('incomplete fields');
        const model = OrphanArabic;
        await saveFieldInForm(model, fieldName, string, entryId, req);
        res.status(200).send('saved');
    } catch (error) {
        console.log(error);
        res.status(500).send(error.toString());
    }
};

exports.saveFamilyField = async (req, res) => {
    try {
        const { entryId } = req.params;
        const { fieldName, string: gotString } = req.body;
        const string = gotString.trim();
        if (!fieldName || !string || !entryId) throw new Error('incomplete fields');
        const model = FamilyArabic;
        await saveFieldInForm(model, fieldName, string, entryId, req);
        res.status(200).send('saved');
    } catch (error) {
        console.log(error);
        res.status(500).send(error.toString());
    }
};

exports.validateFamilyField = async (req, res) => {
    try {
        const { entryId } = req.params;
        const { fieldName, string: gotString } = req.body;
        const string = gotString.trim();
        if (!fieldName || !string || !entryId) throw new Error('Incomplete fields');
        const existing = await FamilyArabic.findOne({
            [fieldName]: string,
            _id: { $ne: entryId }, 
          }).lean();
        if (existing) throw new Error(`${camelCaseToNormalString(fieldName)} is already saved in another document.`);
        res.status(200).send('Go ahead, save this entry');
    } catch (error) {
        console.log(error);
        res.status(500).send(error.message);
    }
};

exports.validateOrphanField = async (req, res) => {
    try {
        const { entryId } = req.params;
        const { fieldName, string: gotString } = req.body;
        const string = gotString.trim();
        if (!fieldName || !string || !entryId) throw new Error('Incomplete fields');
        const existing = await OrphanArabic.findOne({
            [fieldName]: string,
            _id: { $ne: entryId }, 
          }).lean();
        if (existing) throw new Error(`${camelCaseToNormalString(fieldName)} is already saved in another document.`);
        res.status(200).send('Go ahead, save this entry');
    } catch (error) {
        console.log(error);
        res.status(500).send(error.message);
    }
};