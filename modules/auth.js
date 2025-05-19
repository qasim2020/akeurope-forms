const { getModel, getSlug } = require('../modules/getModel');

const authenticate = (req, res, next) => {
    if (req.session.verified) {
        req.user = req.session.user;
        return next();
    }
    return res.status(404).render('error', {
        heading: 'Unauthorized',
        error: 'User is not logged in.',
        redirect: '/',
    });
};

const authorize = async (req, res, next) => {
    const { collectionName, entryId } = req.params;

    try {
        const Model = getModel(collectionName);
        const entry = await Model.findById(entryId);

        if (!entry) {
            return res.status(404).render('error', {
                heading: 'Not Found',
                error: 'Entry not found.',
                redirect: '/',
            });
        };

        if (collectionName === 'GazaOrphan') {
            if (entry.phoneNo1 === req.session.user.phoneNumber || entry.phoneNo2 === req.session.user.phoneNumber) {
                return next();
            };
        } else if (collectionName === 'FamilyArabic') {
            if (entry.uploadedBy?.actorId?.toString() === req.session.user._id) {
                return next();
            }
        };

        throw new Error('You are not authorized to modify this entry.');

    } catch (err) {
        console.error(err);

        return res.status(500).render('error', {
            heading: 'Server Error',
            error: err.message || err.toString(),
            redirect: '/',
        });
    }
};


module.exports = { authenticate, authorize };
