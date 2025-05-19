const { slugToString } = require('../modules/helpers');

const logTemplates = ({ type, entity, actor, slug, changes }) => {
    if (!type || !entity || !actor) {
        throw new Error('Missing required parameters: type, entity, and actor are mandatory.');
    }

    const commons = (entityType, entityId) => ({
        entityType,
        entityId,
        actorType: 'beneficiary',
        actorId: actor._id,
    });

    const templates = {
        formCreated: slug ? {
            ...commons('beneficiary', entity._id),
            action: `<a href="/entry/${entity._id}/project/${slug}">New form</a> created.`,
            color: 'orange',
        } : null,
        formCompleted: slug ? {
            action: `<a href="/entry/${entity._id}/project/${slug}">Form</a> completed.`,
            ...commons('beneficiary', entity._id),
            action: `<a href="/entry/${entity._id}/project/${slug}">Form</a> submitted.`,
            color: 'orange',
        } : null,
        fileUploaded: slug ? {
            ...commons('beneficiary', entity._id),
            action: `File uploaded for <a href="/entry/${entity._id}/project/${slug}">${entity.name || 'entry'}</a>.`,
            color: 'orange',
        } : null,
    };

    if (templates[type] == null) {
        throw new Error(`Incomplete parameters for template type: ${type}`);
    }

    if (!templates[type]) {
        throw new Error(`Unknown log template type: ${type}`);
    }

    return templates[type];
};

module.exports = { logTemplates };