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
                pattern: '9999999999',
                showUser: '1234567890'
            }]
        },
        passportNumber: {
            type: String,
            unique: true,
            sparse: true,
            static: true,
            dir: 'ltr',
            mask: [{
                pattern: '9999999999',
                showUser: '1234567890'
            }]
        },
        maritalStatus: {
            type: String,
            static: true,
            dir: 'rtl',
            enum: ["أعزب", "متزوج من مواطن مصري", "تزوج ممن مواطن غزي", "أرمل", "مطلق"],
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
                value: "تزوج ممن مواطن غزي",
                showFields: ['spouseName', 'spouseIdNumber', 'spousePassportNumber']
            },{
                value: "متزوج من مواطن مصري",
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
            static: true,
            unique: true,
            sparse: true,
            dir: 'ltr',
        },
        spousePassportNumber: {
            type: String,
            static: true,
            unique: true,
            sparse: true,
            dir: 'ltr',
            mask: [{
                pattern: '9999999999',
                showUser: '1234567890'
            }]
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
            mask: [{
                pattern: '+201#########',
                showUser: '+2019876543210'
            },{
                pattern: '+9709999999',
                showUser: '+9709876543',
            }],
            static: true,
        },
        whatsappNumber: {
            type: String,
            dir: 'ltr',
            mask: [{
                pattern: '+201#########',
                showUser: '+2019876543210'
            },{
                pattern: '+9709999999',
                showUser: '+9709876543',
            }],
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
