const mongoose = require('mongoose');
const User = require('../models/User');
const { camelCaseToNormalString } = require('../modules/helpers');
const { saveLog } = require('../modules/logActions');
const { logTemplates } = require('../modules/logTemplates');
const { getChanges } = require('../modules/getChanges');
const { getModel, getSlug } = require('../modules/getModel');

function checkMaskPattern(maskPatterns, fieldValue) {
    if (typeof maskPatterns === 'string' && maskPatterns.indexOf(',') > -1) {
        maskPatterns = maskPatterns.split(',').map(p => p.trim());
    } else if (typeof maskPatterns === 'string') {
        maskPatterns = [maskPatterns.trim()];
    }

    const patternMap = {
        9: '\\d',
        A: '[A-Z]',
        a: '[a-z]',
        '*': '[A-Za-z0-9]',
    };

    return maskPatterns.some(maskPattern => {
        let regexStr = '';

        for (let char of maskPattern) {
            if (patternMap[char]) {
                regexStr += patternMap[char];
            } else {
                regexStr += char.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
            }
        }

        const regex = new RegExp('^' + regexStr + '$');
        return regex.test(fieldValue);
    });
}

const saveFieldInForm = async (model, fieldName, value, entryId, req, slug) => {

    const schemaField = model.schema.path(fieldName);

    if (!schemaField)
        throw new Error(`Field ${fieldName} does not exist`);

    const existing = await model.findOne({ _id: entryId }, { [fieldName]: 1 }).lean();

    let saveField = false;

    if (schemaField?.options?.unique || schemaField?.options?.static) {

        if (!existing?.[fieldName]) {

            if (schemaField?.options?.mask) {
                const array = schemaField?.options?.mask;
                const maskPatterns = array.map((val) => val.pattern).join(',');
                const isValid = checkMaskPattern(maskPatterns, value);
                if (!isValid) throw new Error('Pattern do not match.');
            }

            saveField = true;

        } else {
            saveField = false;
            console.log('Unique field already saved so skipping = or if user trying to delete cant delete!!');
        }
    } else {
        saveField = true;
    }

    if (saveField) {
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

    };

}

const addInStaticArrayField = async (model, fieldName, value, entryId, req) => {

    const schemaField = model.schema.path(fieldName);

    if (!schemaField)
        throw new Error(`Field ${fieldName} does not exist`);

    if (schemaField?.options?.static) {
        const existing = await model.findOne({ _id: entryId }, { [fieldName]: 1 }).lean();

        if (!existing[fieldName] || existing?.[fieldName].length === 0) {
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
        } else if (existing[fieldName] === value) {
            throw new Error('Static array field no changes - so not pushing new value into the array');
        } else {
            const prvs = existing[fieldName];
            if (!prvs)
                throw new Error('Why the field is empty. dont come here.');
            const existingValues = existing[fieldName];
            if (!existingValues || existingValues.length === 0)
                throw new Error('the existing values should be split by a comma (,) - is getting undefined - please check');
            const newValues = value;
            if (!newValues || newValues.length === 0)
                throw new Error('new values should be comma split - but getting no value here - please check');
            const addition = newValues.filter(val => existingValues.includes(val) === false);
            if (!addition || addition.length === 0)
                throw new Error('no new values - why calling this function please check');
            const saveNow = [...existingValues, ...addition];
            await model.updateOne(
                { _id: entryId },
                {
                    $set: {
                        [fieldName]: saveNow,
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
    } else {
        throw new Error('add in field array should not be called for this - please check');
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
        const model = getModel(collectionName);
        if (!model) throw new Error('Model not found');
        const slug = getSlug(collectionName);
        await saveFieldInForm(model, fieldName, string, entryId, req, slug);
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

        const model = getModel(collectionName);
        if (!model) throw new Error('Model not found');

        const schemaField = model.schema.path(fieldName);

        if (schemaField?.options?.static) {
            await addInStaticArrayField(model, fieldName, files, entryId, req);
        } else {
            await saveFieldInForm(model, fieldName, files, entryId, req);
        }
        res.status(200).send('saved');

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
        const model = getModel(collectionName);
        const existing = await model.findOne({
            [fieldName]: string,
            _id: { $ne: entryId },
        }).lean();
        if (existing) {
            const actor = await User.findById(existing.uploadedBy?.actorId).lean()
            throw new Error(`${camelCaseToNormalString(fieldName)}: ${string} is connected with ${actor.phoneNumber || actor.email} in another form. Therefore should not be added here.`);
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
        const model = getModel(collectionName);
        if (!model) throw new Error('Model not found');
        const schemaField = model.schema.path(fieldName);
        if (schemaField?.options?.static)
            throw new Error('Static field can not be deleted.')
        await saveFieldInForm(model, fieldName, "", entryId, req);
        res.status(200).send('Go ahead, save this entry');
    } catch (error) {
        console.log(error);
        res.status(500).send(error.message);
    }
};

exports.formCompleted = async (req, res) => {
    try {
        const { entryId, collectionName } = req.params;
        if (!entryId || !collectionName) throw new Error('Incomplete fields');
        const model = getModel(collectionName);
        const slug = getSlug(collectionName);
        const entry = await model.findOne({ _id: req.params.entryId, 'uploadedBy.actorId': req.session.user._id }).lean();
        if (!entry) throw new Error('Entry not found');

        const allFieldsFilled = Object.values(entry).every(
            (value) => value !== null && value !== undefined
        );

        if (!allFieldsFilled) {
            throw new Error('Entry has missing values');
        }

        await saveLog(logTemplates({
            type: 'formCompleted',
            entity: entry,
            actor: req.session.user,
            slug,
        }));
        
        res.status(200).send('Form completed');
    } catch (error) {
        console.log(error);
        res.status(400).send(error.message);
    }
};