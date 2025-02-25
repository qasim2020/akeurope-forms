const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        size: { type: String, required: true },
        path: { type: String, required: true, unique: true },
        mimeType: { type: String, required: true },
        uploadedBy: {
            actorType: { type: String, required: true },
            actorId: { type: String, required: true },
            actorUrl: { type: String, required: true }
        }
    },
    {
        timestamps: true,
        versionKey: false,
    },
);

module.exports = mongoose.model('File', fileSchema);
