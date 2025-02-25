const translations = {
    name: 'اسم اليتيم',
    gender: 'الجنس',
    orphanId: 'رقم اليتيم',
    dateOfBirth: 'تاريخ الميلاد',
    familyNumber: 'عدد أفراد الأسرة',
    fatherDateOfDeath: 'تاريخ وفاة الأب',
    guardianName: 'اسم الوصي',
    guardianId: 'رقم الوصي',
    phoneNo1: 'رقم الهاتف 1',
    phoneNo2: 'رقم الهاتف 2',
    displacementGov: 'محافظة النزوح',
    displacementArea: 'منطقة النزوح',
    orphanAddress: 'عنوان اليتيم',
    relationToTheOrphan: 'صلة القرابة باليتيم',
    dateOfRegistration: 'تاريخ التسجيل',
    photoOfOrphan: 'صورة اليتيم',
    birthCertificate: 'شهادة الميلاد',
    fatherDeathCertificate: 'شهادة وفاة الأب',
};

function createPhotoField(useTranslation, value = '') {
    const photoKey = 'photoOfOrphan';
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

function createRadioField(key, field, useTranslation, fieldValue = '') {
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

function createInputField(key, field, useTranslation, value = '') {
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

    return `<div class="mb-3">
        <label for="${key}" class="form-label">${label}</label>
        <input type="${inputType}" class="form-control field-control" id="${key}" name="${key}" value="${value}" required>
    </div>`;
}


function createFileInputField(key, field, useTranslation, value = '') {
    const label = useTranslation ? translations[key] || key : key;
    const isImage = value && /\.(jpeg|jpg|png|webp|tiff)$/i.test(value);

    return `<div class="mb-3">
                <label for="${key}" class="form-label">${label}</label>
                <input type="file" class="form-control" id="${key}" name="${key}" 
                    accept="image/jpeg,image/png,image/webp,image/tiff,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document">
                <input type="text" class="form-control field-control d-none" name="${key}" value="${value}"/>
                ${
                    value
                        ? `<a href="/file/${value}" class="btn btn-outline-primary mt-2" download>Download Uploaded File</a>`
                        : ''
                }
                ${isImage ? `<img src="/file/${value}" class="img-thumbnail mt-2" style="max-width: 200px;">` : ''}
            </div>`;
}

function generateFormFields(schema, orphanData = {}, useTranslation = false) {
    const fields = [];
    const forbidden = ['_id', '__v', 'phoneNo1', 'dateOfRegistration'];

    const fieldEntries = Object.keys(schema.paths)
        .filter((key) => !(forbidden.includes(key) || schema.paths[key].options.priority === 0))
        .map((key) => {
            const field = schema.paths[key];
            const existingValue = orphanData[key] || '';
            let fieldHtml;
            if (field.options.fieldType === 'file') {
                fieldHtml = createFileInputField(key, field, useTranslation, existingValue);
            } else if (field.options.fieldType === 'photo') {
                fieldHtml = createPhotoField(useTranslation, existingValue);
            } else {
                fieldHtml =
                    field.enumValues && field.enumValues.length
                        ? createRadioField(key, field, useTranslation, existingValue)
                        : createInputField(key, field, useTranslation, existingValue);
            }

            return { key, html: fieldHtml, priority: field.options.priority || 0 };
        });

    fieldEntries.sort((a, b) => b.priority - a.priority);

    const sortedFields = fieldEntries.map((field, index) => {
        const labelWithSerial = useTranslation
            ? `${index + 1}. ${translations[field.key] || field.key}`
            : `${index + 1}. ${field.key}`;
        const labelClass = useTranslation ? 'form-label arabic' : 'form-label';
        return {
            key: field.key,
            html: field.html.replace(
                /<label[^>]*>(.*?)<\/label>/,
                `<label for="${field.key}" class="${labelClass}">${labelWithSerial}</label>`,
            ),
        };
    });

    fields.push(...sortedFields);

    return fields.map(({ html }) => html).join('');
}

module.exports = { generateFormFields };
