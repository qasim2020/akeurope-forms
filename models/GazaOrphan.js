const mongoose = require('mongoose');

const orphanSchema = new mongoose.Schema(
    {
        attachments: {
            type: [String],
            static: true,
            dir: 'rtl',
            fieldType: "files",
            videos: true,
            priority: 1,            
        },
        name: {
            type: String,
            priority: 1,
            dir: 'ltr',
            static: true,
            sparse: true
        },
        photo: {
            type: String,
            priority: 1,
            dir: 'ltr',
            fieldType: 'photo',
            static: true,
            sparse: true
        },
        phoneNo1: {
            type: String,
            priority: 1,
            dir: 'ltr',
            static: true,
            sparse: true
        },
        phoneNo2: {
            type: String,
            priority: 1,
            dir: 'ltr',
            static: true,
            sparse: true
        },
        uploadedBy: {
            actorType: { type: String, required: true, priority: 0 },
            actorId: { type: String, required: true, priority: 0 },
            actorUrl: { type: String, required: true, priority: 0 },
        },
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

module.exports = global.portalConnection.model('GazaOrphan', orphanSchema, 'gaza-orphans');
