const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
        },
        maxUploads: {
            type: Number,
            default: 1,
        },
        project: {
            type: [String],
        },
        phoneNumber: {
            type: String,
            required: false,
            unique: true,
        },
        email: {
            type: String,
            required: true,
            unique: true
        },
        verified: {
            type: Boolean,
            default: false,
        },
        createdAt: {
            type: Date,
            default: Date.now,
        },
    },
    { collection: 'formUsers' },
);

const User = mongoose.model('User', userSchema);

module.exports = User;
