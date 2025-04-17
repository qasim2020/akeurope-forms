const File = require('../models/File');
const { shortenFileName } = require('../modules/helpers');

function createPhotoField(photoKey, useTranslation, value = '', translations) {
    const photoLabel = useTranslation ? translations[photoKey] || photoKey : photoKey;

    return `
        <div class="mb-3">
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

    const radioButtons = field.enumValues
        .map(
            (value, index) => `
        <label class="form-selectgroup-item w-100 m-0 ${index < field.enumValues.length - 1 ? 'mb-2' : ''}">
            <input class="form-selectgroup-input" type="radio" name="${key}" value="${value}" ${
                fieldValue == value ? 'checked' : ''
            }>
            <div class="form-selectgroup-label d-flex align-items-center p-3">
                <div class="ms-3">
                    <span class="form-selectgroup-check"></span>
                </div>
                <div>
                    <strong>${value}</strong>
                </div>
            </div>
        </label>
    `,
        )
        .join('');

    return `<div class="mb-3">
        <label class="form-label">${label}</label>
        <div class="form-selectgroup w-100 m-0 field-control" name="${key}">${radioButtons}</div>
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

    const isUniqueField = field.options?.unique || false;

    if (isUniqueField) {
        if (value) {
            return `<div class="mb-3">
                <label for="${key}" class="form-label">${label}</label>
                <div class="mb-3 text-secondary fs-4">هذا إدخال فريد. لا يمكن تغيير رقم جواز السفر بعد إضافته.</div>
                <input is-unique=true type="${inputType}" class="form-control field-control" id="${key}" name="${key}" value="${value}" disabled>
            </div>`;
        } else {
            return `<div class="mb-3">
                <label for="${key}" class="form-label">${label}</label>
                <div class="mb-3 text-secondary fs-4">هذا إدخال فريد. لا يمكن تغيير رقم جواز السفر بعد إضافته.</div>
                <input is-unique=true type="${inputType}" class="form-control field-control" id="${key}" name="${key}" required>
            </div>`;
        }
    } else {
        return `<div class="mb-3">
            <label for="${key}" class="form-label">${label}</label>
            <input type="${inputType}" class="form-control field-control" id="${key}" name="${key}" value="${value}" required>
        </div>`;
    }
}

async function createAttachmentsField(key, field, useTranslation, value = '', translations) {
    const label = useTranslation ? translations[key] || key : key;
    let btnGroups = "",
        uploadBtnText = "";
    if (value.length !== 0) {
        const fileIds = value;
        const files = await File.find({ _id: { $in: fileIds } }).lean();
        uploadBtnText = "إضافة مرفق جديد";
        btnGroups = files
            .map(
                (file) => `
                        <div class="btn-group w-100 mb-2 px-0" role="group" dir="ltr" file-id="${file._id}">
                            <a href="/file/${file._id}" class="btn fw-bold text-start py-3" style="flex-grow: 1;" download>
                                <span class="d-none d-md-inline-block"> ${shortenFileName(file.name, 50)}</span>
                                <span class="d-inline-block d-md-none"> ${shortenFileName(file.name, 20)}</span>
                            </a>
                            <button type="button" class="btn fw-bold py-3" style="flex: 0 0 100px;" onclick="deleteFile(this)">
                                <i class="ti ti-trash fs-3"></i>
                            </button>
                        </div>
                    `,
            )
            .join('');
    } else {
        uploadBtnText = 'انقر للتحميل';
    }
    return `
    <div class="mb-3">
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

async function createFileInputField(key, field, useTranslation, value = '', translations) {
    const label = useTranslation ? translations[key] || key : key;
    const isImage = value && /\.(jpeg|jpg|png|webp|tiff)$/i.test(value);

    let file = null;
    if (value) {
        file = await File.findById(value).lean();
    }

    return `<div class="mb-3">
                <label for="${key}" class="form-label">${label}</label>
                <input type="file" class="form-control" id="${key}" name="${key}" 
                    accept="image/jpeg,image/png,image/webp,image/tiff,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document">
                <input type="text" class="form-control field-control d-none" name="${key}" value="${value}"/>
                ${
                    file
                        ? `
                        <a href="/file/${file._id}" class="btn btn-outline-primary mt-2 d-block fw-bold" download>
                            <span class="d-none d-md-inline-block">Download ${file.name}</span>
                            <span class="d-inline-block d-md-none">Download ${shortenFileName(file.name)}</span>
                        </a>`
                        : ''
                }
                ${isImage ? `<img src="/file/${value}" class="img-thumbnail mt-2" style="max-width: 200px;">` : ''}
            </div>`;
}

async function generateFormFields(schema, data = {}, useTranslation = false, translations) {
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
                    fieldHtml = await createAttachmentsField(key, field, useTranslation, existingValue, translations);
                } else if (field.options.fieldType === 'file') {
                    fieldHtml = await createFileInputField(key, field, useTranslation, existingValue, translations);
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
