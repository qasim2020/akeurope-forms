const GazaOrphan = require('../models/GazaOrphan');
const FamilyArabic = require('../models/FamilyArabic');

const getModel = (collectionName) => {
    switch (collectionName) {
        case 'GazaOrphan': 
            return GazaOrphan;
        case 'FamilyArabic':
            return FamilyArabic;
        default:
            throw new Error('Invalid collection name');
    }
}

const getSlug = (collectionName) => {
    switch (collectionName) {
        case 'GazaOrphan':
            return 'gaza-orphans';
        case 'FamilyArabic':
            return 'egypt-family';
        default:
            throw new Error('Invalid collection name');    
    }
};

const getModelFromSlug = (slug) => {
    switch (slug) {
        case 'gaza-orphans': 
            return GazaOrphan;
        case 'egypt-family':
            return FamilyArabic;
        default:
            throw new Error('Invalid collection name');
    }
}

module.exports = { getModel, getSlug, getModelFromSlug };