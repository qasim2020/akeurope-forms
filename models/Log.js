const mongoose = require('mongoose');

const logSchema = new mongoose.Schema({
    entityType: String,
    entityId: mongoose.Schema.Types.ObjectId,
    actorType: String,
    actorId: mongoose.Schema.Types.ObjectId,
    action: String,
    changes: [],
    timestamp: {
        type: Date,
        required: true,
    },
    color: String,
    isNotification: { type: Boolean, default: false },
    isRead: { type: Boolean, default: false },
    isReadByCustomer: { type: Boolean, default: true },
    expiresAt: Date,
}, {
    timestamps: true
});

module.exports = global.portalConnection.model('Log', logSchema);