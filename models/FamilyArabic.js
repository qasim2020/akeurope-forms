const mongoose = require('mongoose');

const familyArabicSchema = new mongoose.Schema(
    {
        name: {
            type: String,
        },
        familyPhoto: {
            type: String,
            fieldType: 'photo'
        },
        idNumber: {
            type: String,
            unique: true,
            sparse: true,
        },
        passportNumber: {
            type: String,
            unique: true,
            sparse: true,
        },
        spouseName: {
            type: String,
        },
        spouseIdNumber: {
            type: String,
            unique: true,
            sparse: true,
        },
        spousePassportNumber: {
            type: String,
            unique: true,
            sparse: true,
        },
        noOfFamilyMembers: {
            type: Number,
        },
        dateOfEntryInEgypt: {
            type: Date,
        },
        addressInEgypt: {
            type: String,
        },
        cityInEgypt: {
            type: String,
            enum: ["القاهرة", "الجيزة", "القليوبية", "الدقهلية" ,"الإسكندرية" ,"شمال سيناء" ,"الشرقية", "الإسماعيلية"]
        },
        phoneNumber: {
            type: String,
        },
        whatsappNumber: {
            type: String,
        },
        attachments: {
            type: [String],
            fieldType: "files"
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
    },
);

module.exports = mongoose.model('FamilyArabic', familyArabicSchema);
