$(document).ready(function () {
    $('[on-page-load]').each(function () {
        const request = $(this).attr('on-page-load');
        if (request === 'handle-connections') {
            const elem = $(this);
            const connectionsString = $(elem).closest('.field').attr('connections');
            const connections = JSON.parse(connectionsString);
            const value = $(elem).val();
            hideShowFields(connections, value);
        }
    });
    handleSubmitBtn();
});

const handleSubmitBtn = function () {
    let fieldStatuses = [];
    $('#entry-container .field-control').each(async function () {
        const isHidden = $(this).closest('.field').hasClass('d-none');
        if (isHidden) {
            fieldStatuses.push('done');
            return;
        };
        const fieldValue = $(this).val() || $(this).find('[type=radio]:checked').val();
        if (fieldValue) {
            const isRadioBtn = $(this).find('[type=radio]:checked').val();
            const isUniqueField = $(this).attr('is-unique') === 'true';
            const isStaticField = $(this).attr('is-static') === 'true';
            const isFilesController = $(this).closest('.attachments-controller').length > 0;

            if (isUniqueField) {
                fieldStatuses.push('done');
            } else if (isStaticField) {
                fieldStatuses.push('done');
            } else if (!isFilesController) {
                fieldStatuses.push('done');
            } else if (isFilesController) {
                const filesUploaded = $(this).closest('.attachments-controller').find('.btn-group').get().length > 0;
                if (filesUploaded) {
                    fieldStatuses.push('done');
                } else {
                    fieldStatuses.push('pending');
                }
            } else if (isRadioBtn) {
                fieldStatuses.push('pending');
            } else {
                fieldStatuses.push('pending');
            }
        } else {
            fieldStatuses.push('pending');
        }
    });

    const formCompleted = fieldStatuses.every(val => val === 'done');
    if (formCompleted) {
        $('#save-form-btn').addClass('d-none');
    }
}

const handleConnections = function (elem) {
    const connectionsString = $(elem).closest('.field').attr('connections');
    const connections = JSON.parse(connectionsString);
    const value = $(elem).find('strong').html();
    hideShowFields(connections, value);
}

const hideShowFields = function (connections, value) {
    const match = connections.find(con => con.value === value);
    if (match?.hideFields) {
        match?.hideFields.forEach(field => {
            $(`.field[field-name=${field}]`).addClass('d-none');
        })
    } else if (match?.showFields) {
        match?.showFields.forEach(field => {
            $(`.field[field-name=${field}]`).removeClass('d-none');
        })
    } else {
        alert('A coding error. please let us know.')
    }
}

const deleteFieldValue = async function (fieldName) {
    if (!fieldName) return alert('field name and string is missing');

    const entryId = $('#entry-container').attr('entry-id');
    const form = $('#entry-container').attr('collection-name');
    await $.ajax({
        url: `/delete-field-value/${form}/${entryId}`,
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({ fieldName }),
    });
};

const addFile = async function (elem) {
    const controller = $(elem).closest('.attachments');
    const uploadFileInput = controller.find('input[type=file]');
    uploadFileInput.click();
};

const saveAttachmentsInEntry = async function (controller) {
    const files = controller
        .find('[file-id]')
        .toArray()
        .map((element) => {
            return $(element).attr('file-id');
        });
    const inputField = controller.find('input[type=text]');
    const fieldName = inputField.attr('name');
    const fieldValue = files;
    inputField.val(fieldValue.join(','));

    const entryId = $('#entry-container').attr('entry-id');
    const form = $('#entry-container').attr('collection-name');

    await $.ajax({
        url: `/update-array-field/${form}/${entryId}`,
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({ fieldName, files }),
    });
};

const shortenFileName = function (string, length) {
    if (string.length <= length) {
        return string;
    }
    const end = string.slice(-length);
    return `...${end}`;
};

const drawFilesBtnGroup = async function (fileId, elem) {
    const form = $('#entry-container').attr('collection-name');
    const entryId = $('#entry-container').attr('entry-id');
    const isStaticField = $(elem).closest('.field').attr('is-static') ? true : false;
    console.log(isStaticField);
    const file = await $.ajax({
        url: `/file-data-open/${form}/${entryId}/${fileId}`,
        method: 'GET',
    });
    const btnGroup = `
    <div class="btn-group w-100 mb-2 px-0" role="group" dir="ltr" file-id="${file._id}">
        <a href="/file-open/${form}/${entryId}/${file._id}" class="btn fw-bold text-start py-3" style="flex-grow: 1;" download>
            <span class="d-none d-md-inline-block"> ${shortenFileName(file.name, 50)}</span>
            <span class="d-inline-block d-md-none"> ${shortenFileName(file.name, 20)}</span>
        </a>
        ${isStaticField ? "" : `<button type="button" class="btn fw-bold py-3" style="flex: 0 0 100px;" onclick="deleteFile(this)">
            <i class="ti ti-trash fs-3"></i>
        </button>`}
    </div>`;
    const controller = $(elem).closest('.attachments');
    controller.append(btnGroup);
};

$('[type=file]').on('change', async function () {
    const file = this.files[0];
    const fieldName = $(this).attr('name');
    const elem = $(this);
    const currentBtn = $(this).siblings('.file-upload-btn');
    const currentBtnHtml = currentBtn.html();
    $(currentBtn).html(`
        <span class="spinner-border spinner-border-sm ms-2" role="status"></span>
        جارٍ تحميل الملف...
        `);
    if (file) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('fieldName', fieldName);
        try {
            const form = $('#entry-container').attr('collection-name');
            const entryId = $('#entry-container').attr('entry-id');
            const fileId = await $.ajax({
                url: `/upload-file-open/${form}/${entryId}`,
                type: 'POST',
                data: formData,
                contentType: false,
                processData: false-open,
            });

            if (!fileId) {
                throw new Error('Could not get file id == strange');
            }
            const isArrayOfFiles = $(elem).closest('.attachments').length > 0;
            if (isArrayOfFiles) {
                await drawFilesBtnGroup(fileId, elem);
                const controller = $(elem).closest('.attachments');
                await saveAttachmentsInEntry(controller);
                controller.addClass('is-valid');
            } else {
                const controller = $(elem).closest('.attachment');
                const fileBtnGroup = controller.find('.btn-group');
                if (fileBtnGroup.length > 0) {
                    const inputField = controller.find('.field-control[type=text]');
                    const fieldName = inputField.attr('name');
                    const fileId = inputField.val();
                    const fieldValue = null;
                    inputField.val(fieldValue);
                    await deleteFieldValue(fieldName);
                    const form = $('#entry-container').attr('collection-name');
                    const entryId = $('#entry-container').attr('entry-id');
                    await $.ajax({
                        url: `/delete-file/${form}/${entryId}/${fileId}`,
                        method: 'POST',
                        contentType: 'application/json',
                        data: JSON.stringify({ fileId }),
                    });
                    fileBtnGroup.remove();
                }
                await drawFileBtnGroup(fileId, elem);
                await saveAttachmentInEntry(controller);
                controller.addClass('is-valid');
            }
            $(currentBtn).html(currentBtnHtml);
        } catch (error) {
            console.error('Error uploading file:', error);
            $(currentBtn).addClass('is-invalid');
            alert(error.responseText || error.message || error.toString() || 'Server Error');
        }
    }
});

const addFieldError = function (elem, error) {
    $(elem).siblings('.form-control').addClass('is-invalid');
    $(elem).addClass('is-invalid');
    $(elem).closest('.image-controller').addClass('is-invalid');
    $(elem).closest('.attachments-controller').addClass('is-invalid');
    $(elem).closest('.attachment-controller').addClass('is-invalid');
    $(elem).closest('.field').append(`
        <div class="invalid-feedback d-block" dir="ltr">${error}</div>
        `);
};

const addFieldSuccess = function (elem) {
    console.log($(elem))
    $(elem).siblings('.form-control').addClass('is-valid');
    $(elem).addClass('is-valid');
    $(elem).closest('.image-controller').addClass('is-valid');
    $(elem).closest('.attachments-controller').addClass('is-valid');
    $(elem).closest('.attachment-controller').addClass('is-valid');
    console.log($(elem));
};

function checkMaskPattern(maskPatterns, fieldValue) {
    if (typeof maskPatterns === 'string' && maskPatterns.indexOf(',') > -1) {
        maskPatterns = maskPatterns.split(',').map(p => p.trim());
    } else if (typeof maskPatterns === 'string') {
        maskPatterns = [maskPatterns.trim()];
    }

    const patternMap = {
        9: '\\d',
        A: '[A-Z]',
        a: '[a-z]',
        '*': '[A-Za-z0-9]',
    };

    console.log(maskPatterns);

    return maskPatterns.some(maskPattern => {
        let regexStr = '';

        for (let char of maskPattern) {
            if (patternMap[char]) {
                regexStr += patternMap[char];
            } else {
                regexStr += char.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
            }
        }

        const regex = new RegExp('^' + regexStr + '$');
        return regex.test(fieldValue);
    });
}

function convertRadioToInput(elem, key, value, isStaticField, dir) {
    const html = `<input dir="${dir}" is-static=${isStaticField} type="text" class="form-control field-control is-valid" id="${key}" name="${key}" value="${value}" disabled>`;
    $(elem).replaceWith(html);
}

const saveForm = async function (elem) {
    let isValid = true;

    $(elem).removeClass('bg-danger');
    $(elem).removeClass('bg-success');
    $(elem).siblings('.alert').remove();
    $('#entry-container').find('.is-valid').removeClass('is-valid');
    $('#entry-container').find('.is-invalid').removeClass('is-invalid');
    $('#entry-container').find('.invalid-feedback').remove();
    const elements = $('#entry-container .field-control').toArray();
    for (const el of elements) {
        const isHidden = $(el).closest('.field').hasClass('d-none');
        if (isHidden) continue;
        const fieldValue = $(el).val() || $(el).find('[type=radio]:checked').val();
        if (fieldValue) {
            try {
                const dir = $(el).closest('.field').attr('dir');
                const isRadioBtn = $(el).find('[type=radio]:checked').val();
                const isUniqueField = $(el).attr('is-unique') === 'true';
                const isStaticField = $(el).attr('is-static') === 'true';
                const maskPattern = $(el).attr('mask-pattern');
                const isFilesController = $(el).closest('.attachments-controller').length > 0;
                const fieldName = $(el).attr('name');

                if (typeof maskPattern === 'string' && maskPattern.length > 0) {
                    const showUser = $(el).attr('placeholder');
                    const isValid = checkMaskPattern(maskPattern, fieldValue);
                    if (!isValid) throw new Error(`${fieldValue} do not match ${showUser}`);
                }

                if (isUniqueField) {
                    await validateField(fieldName, fieldValue);
                    await saveField(fieldName, fieldValue);
                    $(el).attr({ disabled: true });
                }

                if (isStaticField) {
                    $(el).attr({ disabled: true });
                    await saveField(fieldName, fieldValue);
                }

                if (!isFilesController) {
                    await saveField(fieldName, fieldValue);
                }

                if (isRadioBtn) {
                    convertRadioToInput(el, fieldName, fieldValue, isStaticField, dir);
                }

                if (isFilesController) {
                    const filesUploaded = $(el).closest('.attachments-controller').find('.btn-group').get().length > 0;
                    if (!filesUploaded) {
                        throw new Error('Invalid entry');
                    };
                }

                addFieldSuccess(el);
            } catch (error) {
                console.log(error);
                isValid = false;
                const message = error.responseText || error.message || 'Unknown error - handle it';
                addFieldError(el, message);
            }
        } else {
            isValid = false;
            const message = 'Invalid entry';
            addFieldError(el, message);
        }
    };

    if (!isValid) {
        $(elem).addClass('bg-danger');
        $(elem).after(``);
        $(elem).after(`
            <div class="alert alert-danger border-end mt-4" dir="rtl" role="alert">
              <h4 class="alert-title">الرجاء إدخال كافة حقول النموذج</h4>
            </div>`);
    } else {
        $(elem).addClass('bg-success');
        $(elem).after(`
            <div class="alert alert-success mt-4" dir="rtl" role="alert">
              <h4 class="alert-title">شكرا لك على تقديم النموذج</h4>
            </div>`);
        try {
            const entryId = $('#entry-container').attr('entry-id');
            const form = $('#entry-container').attr('collection-name');
            await $.ajax({
                url: `/form-completed/${form}/${entryId}`,
                method: 'POST',
                contentType: 'application/json',
            })
            handleSubmitBtn();
        } catch (error) {
            console.log(error);
            alert(error.responseText || error.toString() || 'Server Error, please send us an email of this error');
        }
    }
};

$(document).on('input change keyup', 'input, .form-control, field-control, [type="radio"]', function () {
    $(this).closest('.field-control').removeClass('is-invalid').removeClass('is-valid');
    $(this).siblings('.form-control, .field-control').removeClass('is-invalid');
    $(this).removeClass('is-invalid');
    $(this).closest('.image-controller').removeClass('is-invalid');
    $(this).siblings('.form-control, .field-control').removeClass('is-valid');
    $(this).removeClass('is-valid');
    $(this).closest('.image-controller').removeClass('is-valid');
});

const saveField = async function (fieldName, string) {
    if (!fieldName || !string) return alert('field name and string is missing');

    const entryId = $('#entry-container').attr('entry-id');
    const form = $('#entry-container').attr('collection-name');

    await $.ajax({
        url: `/update-field/${form}/${entryId}`,
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({ fieldName, string }),
        success: (response) => { },
        error: (error) => {
            console.log(error.responseText);
            throw new Error(error.responseText);
        },
    });
};

const validateField = async function (fieldName, string) {
    if (!fieldName || !string) return alert('field name and string is missing');
    const entryId = $('#entry-container').attr('entry-id');
    const form = $('#entry-container').attr('collection-name');

    await $.ajax({
        url: `/validate-field/${form}/${entryId}`,
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({ fieldName, string }),
        success: (response) => {
            console.log(response);
        },
        error: (error) => {
            console.log(error);
            console.log(error.responseText);
            throw new Error(error.responseText);
        },
    });
};
