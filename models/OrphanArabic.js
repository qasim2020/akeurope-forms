const mongoose = require('mongoose');

const orphanArabicSchema = new mongoose.Schema({
    ser: {
        type: Number,
    },
    name: {
        type: String,
    },
    gender: {
        type: String,
        enum: ['ذكر', 'أنثى', 'آخر']
    },
    orphanId: {
        type: Number,
    },
    dateOfBirth: {
        type: Date,
    },
    familyNumber: {
        type: String,
    },
    fatherDateOfDeath: {
        type: Date,
    },
    guardianName: {
        type: String,
    },
    guardianId: {
        type: Number,
    },
    phoneNo1: {
        type: String,
    },
    phoneNo2: {
        type: String,
    },
    displacementGov: {
        type: String,
    },
    displacementArea: {
        type: String,
    },
    orphanAddress: {
        type: String,
    },
    relationToTheOrphan: {
        type: String,
    },
    dateOfRegistration: {
        type: Date,
        default: Date.now,
    },
    photo: {
        type: String,
    }
});

// Export the Arabic orphan model
module.exports = mongoose.model('OrphanArabic', orphanArabicSchema);
