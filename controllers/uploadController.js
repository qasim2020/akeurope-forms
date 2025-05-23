const mongoose = require('mongoose');
const cloudinary = require('cloudinary').v2;
const File = require('../models/File');
const fs = require('fs').promises;
const path = require('path');
const { saveLog } = require('../modules/logActions');
const { logTemplates } = require('../modules/logTemplates');
const { getModel, getSlug } = require('../modules/getModel');

require('dotenv').config();

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

exports.uploadImage = async (req, res) => {
    try {
        const imageFile = req.file;

        if (!imageFile || !imageFile.mimetype.startsWith('image/')) {
            return res.status(400).json({ message: 'Only image files are allowed.' });
        }

        const { fieldName, folderName, entryId } = req.body;

        const imageBase64 = `data:${imageFile.mimetype};base64,${imageFile.buffer.toString('base64')}`;

        const customPublicId = `${entryId}-${fieldName}`;

        await cloudinary.uploader
            .destroy(customPublicId, { resource_type: 'image' })
            .then((result) => console.log('Deleted existing image:', result))
            .catch((error) => console.error('Error deleting existing image (if any):', error));

        const uploadResult = await cloudinary.uploader.upload(imageBase64, {
            folder: folderName,
            public_id: customPublicId,
            resource_type: 'image',
        });

        res.json({ cloudinaryUrl: uploadResult.secure_url });
    } catch (error) {
        console.error('Error uploading image to Cloudinary:', error);
        res.status(500).json({ message: 'Failed to upload image' });
    }
};

exports.uploadFile = async (req, res) => {
    try {
        const { collectionName, entryId } = req.params;

        const fileMulter = req.file;

        if (!fileMulter) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const slug = getSlug(collectionName);
        const model = getModel(collectionName);
        const entry = await model.findOne({ _id: entryId }).lean();
        if (!entry) {
            throw new Error('Entry not found');
        }

        const file = new File({
            links: [
                {
                    entityType: 'entry',
                    entityId: entryId,
                    entityUrl: `/entry/${entryId}/project/${slug}`,
                }
            ],
            access: ['editor', 'beneficiary'],
            category: 'general',
            name: fileMulter.originalname,
            size: fileMulter.size / 1000,
            path: fileMulter.filename,
            mimeType: fileMulter.mimetype,
            uploadedBy: {
                actorType: 'benificiary',
                actorId: req.session.user._id,
                actorUrl: `/benificiary/${req.session.user._id}`,
            },
        });

        await file.save();

        await saveLog(logTemplates({
            type: 'fileUploaded',
            entity: entry,
            actor: req.session.user,
            slug,
        }));

        res.status(200).send(file._id);
    } catch (error) {
        console.log(error);
        res.status(500).send(error.toString());
    }
};

exports.deleteFile = async (req, res) => {
    try {

        const { fileId, collectionName, entryId, fieldName } = req.params;
        let file;
        file = await File.findOne({ _id: fileId, 'uploadedBy.actorId': req.session.user._id }).lean();

        if (!file) {
            return res.status(404).send({ error: 'File not found' });
        }

        const model = getModel(collectionName);
        if (!model) throw new Error('Model not found');

        const schemaField = model.schema.path(fieldName);

        if (schemaField?.options?.static)
            throw new Error('Files belonging to static field can not be deleted.');

        const dir = path.join(__dirname, process.env.UPLOADS_DIR);
        const filePath = path.join(dir, file.path);
        await fs.unlink(filePath);

        await File.deleteOne({ _id: req.params.fileId });

        res.status(200).send('File deleted successfully!');
    } catch (error) {
        console.log(error);
        res.status(500).send(error.message || error.toString());
    }
};

exports.fileData = async (req, res) => {
    try {
        let file;
        file = await File.findOne({ _id: req.params.fileId, 'uploadedBy.actorId': req.session.user._id }).lean();

        if (!file) {
            return res.status(404).send({ error: 'File not found' });
        }

        res.status(200).send(file);

    } catch (error) {
        console.log(error);
        res.status(500).send(error.toString());
    }
};

exports.file = async (req, res) => {
    try {
        let file;
        console.log('File ID:', req.params.fileId,);

        file = await File.findOne({ _id: req.params.fileId, 'uploadedBy.actorId': req.session.user._id }).lean();

        if (!file) {
            return res.status(404).send({ error: 'File not found' });
        }

        const dirs = [
            process.env.UPLOADS_DIR,
            process.env.PORTAL_UPLOADS_DIR,
        ];

        let filePathFound = null;

        for (const dirName of dirs) {
            const dir = path.join(__dirname, dirName);
            const filePath = path.join(dir, file.path);

            try {
                await fs.access(filePath);
                filePathFound = filePath;
                break;
            } catch (err) {
                console.log(`Not found in ${dirName}: ${err.message}`);
            }
        }

        if (!filePathFound) {
            throw new Error('File not found in any configured directories.');
        }

        res.download(filePathFound, file.name, (err) => {
            if (err) {
                console.error('Error sending file:', err);
                res.status(500).send({ error: 'Failed to send file' });
            }
        });
    } catch (error) {
        console.log(error);
        res.status(500).send(error.toString());
    }
};



exports.uploadFileOpen = async (req, res) => {
    try {
        const { collectionName, entryId } = req.params;

        const fileMulter = req.file;

        if (!fileMulter) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const slug = getSlug(collectionName);
        const model = getModel(collectionName);
        console.log(model);
        const entry = await model.findOne({ _id: entryId }).lean();
        if (!entry) {
            throw new Error('Entry not found');
        }

        const file = new File({
            links: [
                {
                    entityType: 'entry',
                    entityId: entryId,
                    entityUrl: `/entry/${entryId}/project/${slug}`,
                }
            ],
            access: ['editor', 'beneficiary'],
            category: 'general',
            name: fileMulter.originalname,
            size: fileMulter.size / 1000,
            path: fileMulter.filename,
            mimeType: fileMulter.mimetype,
            uploadedBy: {
                actorType: 'benificiary',
                actorId: req.session.user._id,
                actorUrl: `/benificiary/${req.session.user._id}`,
            },
        });

        await file.save();

        await saveLog(logTemplates({
            type: 'fileUploadedOpen',
            entity: entry,
            actor: req.session.user,
            slug,
        }));

        res.status(200).send(file._id);
    } catch (error) {
        console.log(error);
        res.status(500).send(error.toString());
    }
};


exports.fileOpen = async (req, res) => {
    try {
        let file;
        console.log('File ID:', req.params.fileId);

        file = await File.findOne({ _id: req.params.fileId, "uploadedBy.actorId": req.session.user._id }).lean();

        if (!file) {
            return res.status(404).send({ error: 'File not found' });
        }

        const dirs = [
            process.env.UPLOADS_DIR,
            process.env.PORTAL_UPLOADS_DIR,
        ];

        let filePathFound = null;

        for (const dirName of dirs) {
            const dir = path.join(__dirname, dirName);
            const filePath = path.join(dir, file.path);

            try {
                await fs.access(filePath);
                filePathFound = filePath;
                break;
            } catch (err) {
                console.log(`Not found in ${dirName}: ${err.message}`);
            }
        }

        if (!filePathFound) {
            throw new Error('File not found in any configured directories.');
        }

        res.download(filePathFound, file.name, (err) => {
            if (err) {
                console.error('Error sending file:', err);
                res.status(500).send({ error: 'Failed to send file' });
            }
        });
    } catch (error) {
        console.log(error);
        res.status(500).send(error.toString());
    }
};

exports.fileDataOpen = async (req, res) => {
    try {
        let file;
        file = await File.findOne({ _id: req.params.fileId, 'uploadedBy.actorId': req.session.user._id }).lean();

        if (!file) {
            return res.status(404).send({ error: 'File not found' });
        }

        res.status(200).send(file);

    } catch (error) {
        console.log(error);
        res.status(500).send(error.toString());
    }
};