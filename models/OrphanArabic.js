const mongoose = require('mongoose');

const orphanArabicSchema = new mongoose.Schema(
    {
    name: {
        type: String,
        priority: 1,
    },
    gender: {
        type: String,
        enum: ['ذكر', 'أنثى'],
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
    orphanNewAddress: {
        type: String,
    },
    orphanOldAddress: {
        type: String,
    },
    relationToTheOrphan: {
        type: String,
    },
    dateOfRegistration: {
        type: Date,
        default: Date.now,
    },
    photoOfOrphan: {
        type: String,
        priority: 1,
        fieldType: 'photo',
    },
    photoOfGuardianId: {
        type: String,
        priority: 1,
        fieldType: 'file',
    },
    birthCertificate: {
        type: String,
        priority: 1,
        fieldType: 'file',
    },
    fatherDeathCertificate: {
        type: String,
        priority: 1,
        fieldType: 'file',
    },
    uploadedBy: {
        actorType: { type: String, required: true, priority: 0 },
        actorId: { type: String, required: true, priority: 0 },
        actorUrl: { type: String, required: true, priority: 0 },
    },
},{
    timestamps: true,
    versionKey: false,
}
);

module.exports = mongoose.model('OrphanArabic', orphanArabicSchema);
