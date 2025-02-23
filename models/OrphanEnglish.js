const mongoose = require('mongoose');

const orphanEnglishSchema = new mongoose.Schema({
    ser: {
        type: Number,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    gender: {
        type: String,
        enum: ['Male', 'Female', 'Other'],
        required: true
    },
    orphanId: {
        type: Number,
        required: true
    },
    dateOfBirth: {
        type: Date,
        required: true
    },
    familyNumber: {
        type: String,
        required: true
    },
    fatherDateOfDeath: {
        type: Date,
        required: true
    },
    guardianName: {
        type: String,
        required: true
    },
    guardianId: {
        type: Number,
        required: true
    },
    phoneNo1: {
        type: String,
        required: true
    },
    phoneNo2: {
        type: String,
        required: false
    },
    displacementGov: {
        type: String,
        required: true
    },
    displacementArea: {
        type: String,
        required: true
    },
    orphanAddress: {
        type: String,
        required: true
    },
    relationToTheOrphan: {
        type: String,
        required: true
    },
    dateOfRegistration: {
        type: Date,
        default: Date.now,
        required: true
    },
    photo: {
        type: String,
        required: true
    }
});

// Export the English orphan model
module.exports = mongoose.model('OrphanEnglish', orphanEnglishSchema);
