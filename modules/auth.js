const mongoose = require('mongoose');

const authenticate = (req, res, next) => {
    if (req.session.verified) {
        req.user = req.session.user;
        return next();
    }
    return res.status(404).render('error', {
        heading: 'Unauthorized',
        error: 'User is not logged in.',
    });
};

const authorize = async (req, res, next) => {
    const { collectionName, entryId } = req.params;

    try {
        const Model = mongoose.model(collectionName);
        const entry = await Model.findById(entryId);

        if (!entry) {
            return res.status(404).render('error', {
                heading: 'Not Found',
                error: 'Entry not found.',
            });
        }

        if (entry.uploadedBy?.actorId?.toString() === req.session.user._id) {
            return next();
        }

        return res.status(403).render('error', {
            heading: 'Forbidden',
            error: 'You are not authorized to modify this entry.',
        });
    } catch (err) {
        return res.status(500).render('error', {
            heading: 'Server Error',
            error: 'Something went wrong while authorizing.',
        });
    }
};


module.exports = { authenticate, authorize };
