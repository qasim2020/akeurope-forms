const deleteFile = async function (elem) {
    try {
        const fileId = $(elem).closest('[file-id]').attr('file-id');
        const form = $('#entry-container').attr('collection-name');
        const entryId = $('#entry-container').attr('entry-id');
        await $.ajax({
            url: `/delete-file/${form}/${entryId}/${fileId}`,
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ fileId }),
        });
        const controller = $(elem).closest('.attachments');
        $(elem).closest('.btn-group').remove();
        await saveAttachmentsInEntry(controller);
    } catch (error) {
        alert(error.responseText || error.toString() || 'Server Error, please send us an email of this error');
    }
};

const deleteSingleFile = async function (elem) {
    try {
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
    } catch (error) {
        alert(error.responseText || error.toString() || 'Server Error, please send us an email of this error');
    }
};

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

const deleteAndAddFile = async function (elem) {
    try {
        const controller = $(elem).closest('.attachment');
        const uploadFileInput = controller.find('input[type=file]');
        uploadFileInput.click();
    } catch (error) {
        console.log(error);
        alert(error.responseText || error.toString() || 'Server Error, please send us an email of this error');
    }
};

const addFile = async function (elem) {
    const controller = $(elem).closest('.attachments');
    const uploadFileInput = controller.find('input[type=file]');
    uploadFileInput.click();
};

const saveAttachmentInEntry = async function (controller) {
    const file = controller.find('[file-id]').attr('file-id');
    const inputField = controller.find('input[type=text]');
    const fieldName = inputField.attr('name');
    const fieldValue = file;
    inputField.val(fieldValue);
    await saveField(fieldName, fieldValue);
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
        data: JSON.stringify({ fieldName, files })
    });
};

const shortenFileName = function (string, length) {
    if (string.length <= length) {
        return string;
    }
    const end = string.slice(-length);
    return `...${end}`;
};

const drawFileBtnGroup = async function (fileId, elem) {
    const form = $('#entry-container').attr('collection-name');
    const entryId = $('#entry-container').attr('entry-id');
    const file = await $.ajax({
        url: `/file-data/${form}/${entryId}/${fileId}`,
        method: 'GET',
    });
    const btnGroup = `
    <div class="btn-group w-100 mb-2 px-0" role="group" dir="ltr" file-id="${file._id}">
        <a href="/file/${file._id}" class="btn fw-bold text-start py-3" style="flex-grow: 1;" download>
            <span class="d-none d-md-inline-block"> ${shortenFileName(file.name, 50)}</span>
            <span class="d-inline-block d-md-none"> ${shortenFileName(file.name, 20)}</span>
        </a>
        <button type="button" class="btn fw-bold py-3" style="flex: 0 0 100px;" onclick="deleteSingleFile(this)">
            <i class="ti ti-trash fs-3"></i>
        </button>
    </div>`;
    const controller = $(elem).closest('.attachment-controller');
    controller.append(btnGroup);
};

const drawFilesBtnGroup = async function (fileId, elem) {
    const form = $('#entry-container').attr('collection-name');
    const entryId = $('#entry-container').attr('entry-id');
    const file = await $.ajax({
        url: `/file-data/${form}/${entryId}/${fileId}`,
        method: 'GET',
    });
    const btnGroup = `
    <div class="btn-group w-100 mb-2 px-0" role="group" dir="ltr" file-id="${file._id}">
        <a href="/file/${file._id}" class="btn fw-bold text-start py-3" style="flex-grow: 1;" download>
            <span class="d-none d-md-inline-block"> ${shortenFileName(file.name, 50)}</span>
            <span class="d-inline-block d-md-none"> ${shortenFileName(file.name, 20)}</span>
        </a>
        <button type="button" class="btn fw-bold py-3" style="flex: 0 0 100px;" onclick="deleteFile(this)">
            <i class="ti ti-trash fs-3"></i>
        </button>
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
                url: `/upload-file/${form}/${entryId}`,
                type: 'POST',
                data: formData,
                contentType: false,
                processData: false,
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
                };
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

const addFieldError = function (elem) {
    $(elem).siblings('.form-control').addClass('is-invalid');
    $(elem).addClass('is-invalid');
    $(elem).closest('.image-controller').addClass('is-invalid');
    $(elem).closest('.attachments-controller').addClass('is-invalid');
    $(elem).closest('.attachment-controller').addClass('is-invalid');
};

const addFieldSuccess = function (elem) {
    $(elem).siblings('.form-control').addClass('is-valid');
    $(elem).addClass('is-valid');
    $(elem).closest('.image-controller').addClass('is-valid');
    $(elem).closest('.attachments-controller').addClass('is-valid');
    $(elem).closest('.attachment-controller').addClass('is-valid');
};

const saveForm = async function (elem) {
    let isValid = true;

    $(elem).removeClass('bg-danger');
    $(elem).removeClass('bg-success');
    $(elem).siblings('.alert').remove();
    $('#entry-container').find('.is-valid').removeClass('is-valid');
    $('#entry-container').find('.is-invalid').removeClass('is-invalid');

    $('#entry-container .field-control').each(async function () {
        const isFilesController = $(this).closest('.attachments-controller').length > 0;
        const fieldName = $(this).attr('name');
        const fieldValue = $(this).val() || $(this).find('[type=radio]:checked').val();
        const isUniqueField = $(this).attr('is-unique') === 'true';
        if (fieldValue) {
            try {
                if (isUniqueField) {
                    await validateField(fieldName, fieldValue);
                    await saveField(fieldName, fieldValue);
                    $(this).attr({ disabled: true });
                }
                if (!isFilesController) {
                    await saveField(fieldName, fieldValue);
                }
                addFieldSuccess(this);
            } catch (error) {
                addFieldError(this);
                alert(error.responseText);
            }
        } else {
            isValid = false;
            addFieldError(this);
        }
    });

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

const uploadImage = function (elem) {
    const fileInput = $(elem).find('input[type=file]');
    fileInput[0].click();
    fileInput.off('change').on('change', function () {
        let inputName = $(this).attr('name');
        if (event.target.files && event.target.files[0]) {
            var reader = new FileReader();
            reader.onload = function (e) {
                $(elem).closest('.image-upload').find('img').attr('src', e.target.result);
            };

            reader.readAsDataURL(event.target.files[0]);

            var formData = new FormData();
            const folderName = $('#entry-container').attr('collection-name');
            formData.append('image', event.target.files[0]);
            formData.append('folderName', `/akeurope/forms/${folderName}`);
            formData.append('fieldName', $(this).attr('name'));
            formData.append('entryId', $('#entry-container').attr('entry-id'));

            $(elem)
                .closest('.image-upload')
                .find('.btn')
                .html(`<span class="spinner-border spinner-border-sm" role="status"></span>`);

            const form = $('#entry-container').attr('collection-name');
            const entryId = $('#entry-container').attr('entry-id');
            $.ajax({
                url: `/upload-image/${form}/${entryId}`,
                type: 'POST',
                data: formData,
                contentType: false,
                processData: false,
                success: async function (response) {
                    await saveField(inputName, response.cloudinaryUrl);
                    $(elem).closest('.image-controller').addClass('is-valid');
                    $(elem).closest('.image-upload').find('.cloudinaryUrl').val(response.cloudinaryUrl);
                    $(elem).closest('.image-upload').find('.btn').html(`
                <svg  xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-check"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M5 12l5 5l10 -10" /></svg>
              `);
                    $(elem).closest('.image-upload').find('img').attr('src', response.cloudinaryUrl);
                },
                error: function (error) {
                    $(elem).closest('.image-controller').addClass('is-invalid');
                    $(elem).closest('.image-upload').find('.btn').html(`
                <svg  xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-x"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M18 6l-12 12" /><path d="M6 6l12 12" /></svg>
              `);
                    alert('Error uploading image:', error.responseText);
                },
            });
        }
    });
};

const saveField = async function (fieldName, string) {
    if (!fieldName || !string) return alert('field name and string is missing');

    const entryId = $('#entry-container').attr('entry-id');
    const form = $('#entry-container').attr('collection-name');

    await $.ajax({
        url: `/update-field/${form}/${entryId}`,
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({ fieldName, string }),
        success: (response) => {},
        error: (error) => {
            console.log(error.responseText);
            alert(error.responseText);
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
