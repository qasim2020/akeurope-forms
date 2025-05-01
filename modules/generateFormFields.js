const File = require('../models/File');
const { shortenFileName } = require('../modules/helpers');

function createPhotoField(photoKey, useTranslation, value = '', translations) {
    const photoLabel = useTranslation ? translations[photoKey] || photoKey : photoKey;

    return `
        <div class="mb-3 field">
            <label for="${photoKey}" class="form-label">${photoLabel}</label>
            <div onclick="uploadImage(this)" class="image-controller cursor-pointer image-upload row text-center bg-secondary-lt justify-content-center d-flex align-items-center border rounded p-3" style="margin: 0 0.5px">
                <div class="col-md-6 mb-2 mb-md-0">
                    <img class="img-thumbnail" src="${
                        value ? value : '/static/images/no-image-placement.png'
                    }" alt="" style="max-width: 200px;">
                    <input type="file" class="form-control d-none" name="${photoKey}" accept="image/*"> 
                    <input class="cloudinaryUrl field-control d-none" name="${photoKey}" value="${value}"> 
                </div>
                <div class="col-md-6">
                    <a class="btn btn-secondary-outline btn-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-upload">
                            <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
                            <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2 -2v-2"></path>
                            <path d="M7 9l5 -5l5 5"></path>
                            <path d="M12 4l0 12"></path>
                        </svg>
                    </a>
                </div>
            </div>
        </div>
    `;
}

function createRadioField(key, field, useTranslation, fieldValue = '', translations) {
    const label = useTranslation ? translations[key] || key : key;
    let html;

    const dir = field.options?.dir || false;
    const isStaticField = field.options?.static ? true : false;
    const connections = field.options?.connections ? JSON.stringify(field.options?.connections) : false;

    console.log(connections);

    if (!dir) throw new Error('dir is required');
    
    if (fieldValue && isStaticField) {
        html = `<input dir="${dir}" is-static=${isStaticField} on-page-load="${connections ? 'handle-connections' : ""}" type="text" class="form-control field-control" id="${key}" name="${key}" value="${fieldValue}" disabled>`;
    } else {
        const radioBtns = field.enumValues
            .map( (value, index) => `
                    <label class="form-selectgroup-item w-100 m-0 ${index < field.enumValues.length - 1 ? 'mb-2' : ''}">
                        <input class="form-selectgroup-input" type="radio" name="${key}" value="${value}" ${
                                fieldValue == value ? 'checked' : ''
                            }>
                        <div class="form-selectgroup-label d-flex align-items-center p-3" ${connections ? 'onclick="handleConnections(this)"' : ""}>
                            <div class="ms-3">
                                <span class="form-selectgroup-check"></span>
                            </div>
                            <div>
                                <strong>${value}</strong>
                            </div>
                        </div>
                    </label>
                `,
            ).join('');
        html = `<div class="form-selectgroup w-100 m-0 field-control" name="${key}">${radioBtns}</div>`;
    }

    return `<div class="mb-3 field" dir="${dir}" connections='${connections}' field-name="${key}">
        <label class="form-label">${label}</label>
        ${html}
    </div>`;
}

function createInputField(key, field, useTranslation, value = '', translations) {
    const label = useTranslation ? translations[key] || key : key;
    let inputType;

    switch (field.instance) {
        case 'String':
            inputType = 'text';
            break;
        case 'Number':
            inputType = 'number';
            break;
        case 'Date':
            inputType = 'date';
            value = value ? new Date(value).toISOString().split('T')[0] : '';
            break;
        default:
            inputType = 'text';
            break;
    }

    function getMaskUserShow() {
        const array = field.options?.mask;
        return array.map((val) => val.showUser).join(' / ');
    }

    function getMaskPattern() {
        const array = field.options?.mask;
        return array.map((val) => val.pattern).join(',');
    }

    const isUniqueField = field.options?.unique ? true : false;
    const dir = field.options?.dir || false;

    if (!dir) throw new Error('dir is required');

    const maskPattern = field.options?.mask ? getMaskPattern() : '';
    const maskUserShow = field.options?.mask ? getMaskUserShow() : '';
    const isStaticField = field.options?.static ? true : false;

    if (isUniqueField || isStaticField) {
        if (value) {
            return `<div class="mb-3 field" field-name="${key}">
                <label for="${key}" class="form-label">${label}</label>
                <input dir="${dir}" is-static=${isStaticField} is-unique=${isUniqueField} type="${inputType}" class="form-control field-control" id="${key}" name="${key}" value="${value}" disabled>
            </div>`;
        } else {
            return `<div class="mb-3 field" field-name="${key}">
                <label for="${key}" class="form-label">${label}</label>
                <input dir="${dir}" is-static=${isStaticField} mask-pattern="${maskPattern}" placeholder="${maskUserShow}" is-unique=${isUniqueField} type="${inputType}" class="form-control field-control" id="${key}" name="${key}" required>
            </div>`;
        }
    } else {
        return `<div class="mb-3 field" field-name="${key}">
            <label for="${key}" class="form-label">${label}</label>
            <input dir="${dir}" is-static=${isStaticField} mask-pattern="${maskPattern}" placeholder="${maskUserShow}" type="${inputType}" class="form-control field-control" id="${key}" name="${key}" value="${value}" required>
        </div>`;
    }
}

async function createAttachmentsField(key, field, useTranslation, value = '', translations, collectionName, entryId) {
    const label = useTranslation ? translations[key] || key : key;
    const isStaticField = field.options?.static ? true : false;
    let btnGroups = '',
        uploadBtnText = '';
    if (value.length !== 0) {
        const fileIds = value;
        const files = await File.find({ _id: { $in: fileIds } }).lean();
        uploadBtnText = 'إضافة مرفق جديد';
        btnGroups = files
            .map(
                (file) => `
                        <div class="btn-group w-100 mb-2 px-0" role="group" dir="ltr" file-id="${file._id}">
                            <a href="/file/${collectionName}/${entryId}/${file._id}" class="btn fw-bold text-start py-3" style="flex-grow: 1;" download>
                                <span class="d-none d-md-inline-block"> ${shortenFileName(file.name, 50)}</span>
                                <span class="d-inline-block d-md-none"> ${shortenFileName(file.name, 20)}</span>
                            </a>
                            ${isStaticField ? '' : `<button type="button" class="btn fw-bold py-3" style="flex: 0 0 100px;" onclick="deleteFile(this)">
                                <i class="ti ti-trash fs-3"></i>
                            </button>`}
                        </div>
                    `,
            )
            .join('');
    } else {
        uploadBtnText = 'انقر للتحميل';
    }
    return `
    <div class="mb-3 field" is-static='${isStaticField}' field-name="${key}">
        <label for="${key}" class="form-label">${label}</label>
        <div class="attachments attachments-controller row text-center bg-secondary-lt justify-content-center d-flex align-items-center border rounded p-3 pb-2" style="margin: 0 0.5px">
            <button class="file-upload-btn btn btn-secondary-outline mb-2" onclick="addFile(this)">
                <svg  xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-plus ms-2"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 5l0 14" /><path d="M5 12l14 0" /></svg>
                ${uploadBtnText}
            </button>
            <input type="file" class="form-control d-none" id="${key}" name="${key}" 
                accept="application/pdf,image/jpeg,image/png,image/webp,image/tiff">
            <input type="text" class="form-control field-control d-none" name="${key}" value="${value}"/>
            ${btnGroups}
        </div>
    </div>`;
}

async function createFileInputField(key, field, useTranslation, value = '', translations, collectionName, entryId) {
    const label = useTranslation ? translations[key] || key : key;
    let btn = '';
    if (value.length !== 0) {
        const fileId = value;
        const file = await File.findById(fileId).lean();
        if (!file) throw new Error('No file found.');
        btn = `
            <div class="btn-group w-100 mb-2 px-0" role="group" dir="ltr" file-id="${file._id}">
                <a href="/file/${collectionName}/${entryId}/${file._id}" class="btn fw-bold text-start py-3" style="flex-grow: 1;" download>
                    <span class="d-none d-md-inline-block"> ${shortenFileName(file.name, 50)}</span>
                    <span class="d-inline-block d-md-none"> ${shortenFileName(file.name, 20)}</span>
                </a>
                <button type="button" class="btn fw-bold py-3" style="flex: 0 0 100px;" onclick="deleteSingleFile(this)">
                    <i class="ti ti-trash fs-3"></i>
                </button>
            </div>
        `;
    }
    return `
    <div class="mb-3 field" field-name="${key}">
        <label for="${key}" class="form-label">${label}</label>
        <div class="attachment attachment-controller row text-center bg-secondary-lt justify-content-center d-flex align-items-center border rounded p-3 pb-2" style="margin: 0 0.5px">
            <button class="file-upload-btn btn btn-secondary-outline mb-2" onclick="deleteAndAddFile(this)">
                <svg  xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-plus ms-2"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 5l0 14" /><path d="M5 12l14 0" /></svg>
                انقر للتحميل
            </button>
            <input type="file" class="form-control d-none" id="${key}" name="${key}" 
                accept="application/pdf,image/jpeg,image/png,image/webp,image/tiff">
            <input type="text" class="form-control field-control d-none" name="${key}" value="${value}"/>
            ${btn || ''}
        </div>
    </div>`;
}

async function generateFormFields(schema, data = {}, useTranslation = false, translations, collectionName, entryId) {
    const fields = [];
    const forbidden = ['_id', '__v', 'dateOfRegistration', 'createdAt', 'updatedAt'];

    const fieldEntries = await Promise.all(
        Object.keys(schema.paths)
            .filter((key) => !(forbidden.includes(key) || schema.paths[key].options.priority === 0))
            .map(async (key) => {
                const field = schema.paths[key];
                const existingValue = (data && data[key]) || '';
                let fieldHtml;

                if (field.options.fieldType === 'files') {
                    fieldHtml = await createAttachmentsField(key, field, useTranslation, existingValue, translations, collectionName, entryId);
                } else if (field.options.fieldType === 'file') {
                    fieldHtml = await createFileInputField(key, field, useTranslation, existingValue, translations, collectionName, entryId);
                } else if (field.options.fieldType === 'photo') {
                    fieldHtml = createPhotoField(key, useTranslation, existingValue, translations);
                } else {
                    fieldHtml =
                        field.enumValues && field.enumValues.length
                            ? createRadioField(key, field, useTranslation, existingValue, translations)
                            : createInputField(key, field, useTranslation, existingValue, translations);
                }

                return { key, html: fieldHtml, priority: field.options.priority || 1000 };
            }),
    );

    fieldEntries.sort((a, b) => a.priority - b.priority);

    const sortedFields = fieldEntries.map((field, index) => {
        const labelWithSerial = useTranslation
            ? `${index + 1}. ${translations[field.key] || field.key}`
            : `${index + 1}. ${field.key}`;
        const labelClass = useTranslation ? 'form-label arabic' : 'form-label';
        return {
            key: field.key,
            html: field.html.replace(
                /<label[^>]*>(.*?)<\/label>/,
                `<label for="${field.key}" class="${labelClass} pb-2">${labelWithSerial}</label>`,
            ),
        };
    });

    fields.push(...sortedFields);

    return fields.map(({ html }) => html).join('');
}

module.exports = { generateFormFields };
