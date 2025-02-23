const translations = {
    ser: 'رقم التسلسل',
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
    photo: 'صورة اليتيم',
};

function generateFormFields(schema, useTranslation = false) {
    const fields = [];

    const photoKey = 'photo';
    const photoLabel = useTranslation ? translations[photoKey] || photoKey : photoKey;

    const photoFieldHtml = `
        <div class="mb-3">
            <label for="${photoKey}" class="form-label">${photoLabel}</label>
            <div onclick="uploadImage(this)" class="cursor-pointer image-upload row text-center bg-secondary-lt justify-content-center d-flex align-items-center border rounded p-3" style="margin: 0 0.5px">
                <div class="col-md-6 mb-2 mb-md-0">
                    <img class="img-thumbnail" src="/static/images/no-image-placement.png" alt="" style="max-width: 200px;">
                    <input type="file" class="form-control d-none" name="${photoKey}" accept="image/*"> 
                    <input type="hidden" class="cloudinaryUrl" name="${photoKey}"> 
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

    fields.push({ html: photoFieldHtml });

    const forbidden = ['_id','__v', 'phoneNo1', 'dateOfRegistration', 'photo'];

    Object.keys(schema.paths)
        .filter((key) => !forbidden.includes(key))
        .forEach((key) => {
            const field = schema.paths[key];
            const label = useTranslation ? translations[key] || key : key;

            if (field.enumValues && field.enumValues.length) {
                const radioButtons = field.enumValues.map(value => `
                    <label class="form-selectgroup-item w-100 m-0 mb-2">
                        <input class="form-selectgroup-input" type="radio" name="${key}" value="${value}">
                        <div class="form-selectgroup-label d-flex align-items-center p-3">
                            <div class="ms-3">
                                <span class="form-selectgroup-check"></span>
                            </div>
                            <div>
                                <strong>${value}</strong>
                            </div>
                        </div>
                    </label>
                `).join('');

                fields.push({ key, html: `<div class="mb-3"><label class="form-label">${label}</label><div class="form-selectgroup w-100 m-0">${radioButtons}</div></div>` });
            } else {
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
                        break;
                    default:
                        inputType = 'text';
                        break;
                }

                fields.push({ key, html: `<div class="mb-3"><label for="${key}" class="form-label">${label}</label><input type="${inputType}" class="form-control" id="${key}" name="${key}" required></div>` });
            }
        });

    return fields.map(({ html }) => html).join('');
}

module.exports = { generateFormFields };
