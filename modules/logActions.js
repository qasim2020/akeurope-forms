const Log = require('../models/Log');

const saveLog = async ({
    entityType,
    entityId,
    actorType,
    actorId,
    action,
    changes,
    url,
    color,
    isNotification,
    isRead,
    isReadByCustomer,
    expiresAt,
}) => {
    try {
        const log = new Log({
            entityType,
            entityId,
            actorType,
            actorId,
            action,
            changes,
            url,
            timestamp: new Date(),
            isNotification,
            isRead,
            isReadByCustomer,
            expiresAt,
            color,
        });

        await log.save();
    } catch (error) {
        console.error('Error creating log:', error);
        return error;
    }
};

module.exports = {
    saveLog
}