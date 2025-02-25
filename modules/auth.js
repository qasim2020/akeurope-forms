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

module.exports = { authenticate };
