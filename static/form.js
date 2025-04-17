const deleteFile = async function (elem) {
    try {
        const fileId = $(elem).closest('[file-id]').attr('file-id');
        const response = await $.ajax({
            url: `/delete-file/${fileId}`,
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

const addFile = async function(elem) {
    const controller = $(elem).closest('.attachments');
    const uploadFileInput = controller.find('input[type=file]');
    uploadFileInput.click();
}

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
    await saveField(fieldName, fieldValue);
};

const shortenFileName = function(string, length) {
    if (string.length <= length) {
        return string;
    }
    const end = string.slice(-length);
    return `...${end}`;       
}

const drawFilesBtnGroup = async function(fileId, elem) {
    const file = await $.ajax({
        url: `/file-data/${fileId}`,
        method: 'GET'
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
}

$('[type=file]').on('change', async function () {
    const file = this.files[0];
    const fieldName = $(this).attr('name');
    const elem = $(this);
    const currentBtn = $(this).siblings('.file-upload-btn') || $(this);
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
            const fileId = await $.ajax({
                url: '/upload-file',
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
                await saveField(fieldName, fileId);
                $(elem).next('.field-control').val(fileId);
                $(elem).addClass('is-valid');
            }
            $(currentBtn).html(currentBtnHtml);
        } catch (error) {
            console.error('Error uploading file:', error);
            $(currentBtn).addClass('is-invalid');
            alert(error.responseText || error.message || error.toString() || 'Server Error');
        }
    };
});

const addFieldError = function(elem) {
    $(elem).siblings('.form-control').addClass('is-invalid');
    $(elem).addClass('is-invalid');
    $(elem).closest('.image-controller').addClass('is-invalid');
    $(elem).closest('.attachments-controller').addClass('is-invalid');
}

const addFieldSuccess = function(elem) {
    $(elem).siblings('.form-control').addClass('is-valid');
    $(elem).addClass('is-valid');
    $(elem).closest('.image-controller').addClass('is-valid');
    $(elem).closest('.attachments-controller').addClass('is-valid');
}

const saveForm = async function (elem) {
    let isValid = true;

    $(elem).removeClass('bg-danger');
    $(elem).removeClass('bg-success');
    $(elem).siblings('.alert').remove();
    $('#entry-container').find('.is-valid').removeClass('is-valid');
    $('#entry-container').find('.is-invalid').removeClass('is-invalid');

    $('#entry-container .field-control').each(async function () {
        const fieldName = $(this).attr('name');
        const fieldValue = $(this).val() || $(this).find('[type=radio]:checked').val();
        const isUniqueField = $(this).attr('is-unique') === 'true';
        if (fieldValue) {
            try {
                if (isUniqueField) {
                    await validateField(fieldName, fieldValue);
                    await saveField(fieldName, fieldValue);
                    $(this).attr({ disabled: true });
                } else {
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
