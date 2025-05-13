const mongoose = require('mongoose');

const familyArabicSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            static: true,
            dir: 'rtl',
        },
        idNumber: {
            type: String,
            unique: true,
            sparse: true,
            static: true,
            dir: 'ltr',
            mask: [{
                pattern: '999999999',
                showUser: '123456789'
            }]
        },
        passportNumber: {
            type: String,
            unique: true,
            sparse: true,
            static: true,
            dir: 'ltr',
        },
        maritalStatus: {
            type: String,
            static: true,
            dir: 'rtl',
            enum: ["أعزب", "متزوج", "أرمل", "مطلق"],
            connections: [{
                value: "أرمل",
                hideFields: ['spouseName', 'spouseIdNumber', 'spousePassportNumber']
            },{
                value: "أعزب",
                hideFields: ['spouseName', 'spouseIdNumber', 'spousePassportNumber']
            },{
                value: "مطلق",
                hideFields: ['spouseName', 'spouseIdNumber', 'spousePassportNumber']
            },{
                value: "متزوج",
                showFields: ['spouseName', 'spouseIdNumber', 'spousePassportNumber']
            }],
        },
        spouseName: {
            type: String,
            static: true,
            dir: 'rtl',
        },
        spouseIdNumber: {
            type: String,
            unique: true,
            sparse: true,
            static: true,
            dir: 'ltr',
            mask: [{
                pattern: '999999999',
                showUser: '123456789'
            }]
        },
        spousePassportNumber: {
            type: String,
            static: true,
            unique: true,
            sparse: true,
            dir: 'ltr',
        },
        noOfFamilyMembers: {
            type: Number,
            static: true,
            dir: 'ltr',
        },
        dateOfEntryInEgypt: {
            type: Date,
            static: true,
            dir: 'ltr',
        },
        cityInEgypt: {
            type: String,
            static: true,
            dir: 'rtl',
            enum: ["القاهرة", "الجيزة", "القليوبية", "الدقهلية" ,"الإسكندرية" ,"شمال سيناء" ,"الشرقية", "حلوان", "الإسماعيلية"]
        },
        addressInEgypt: {
            type: String,
            static: true,
            dir: 'rtl',
        },
        phoneNumber: {
            type: String,
            dir: 'ltr',
            static: true,
        },
        whatsappNumber: {
            type: String,
            dir: 'ltr',
            static: true
        },
        attachments: {
            type: [String],
            static: true,
            dir: 'rtl',
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
