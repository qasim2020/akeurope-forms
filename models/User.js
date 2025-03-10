const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
        },
        maxUploads: {
            type: Number,
            default: 20,
        },
        phoneNumber: {
            type: String,
            required: true,
            unique: true,
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
