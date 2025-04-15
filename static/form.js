
$('[type=file]').on('change', function () {
    const file = this.files[0];
    const fieldName = $(this).attr('name');
    const elem = $(this);

    if (file) {

      const formData = new FormData();
      formData.append('file', file);
      formData.append('fieldName', fieldName);

      $.ajax({
        url: '/upload-file',
        type: 'POST',
        data: formData,
        contentType: false,
        processData: false,
        success: async function (response) {
          await saveField(fieldName, response);
          $(elem).next(".field-control").val(response);
          $(elem).addClass('is-valid');
        },
        error: function (xhr, status, error) {
          console.error('Error uploading file:', error);
          $(elem).addClass('is-invalid');
          alert(error.responseText);
        },
      });
    }

  });

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
      const isUniqueField = $(this).attr('is-unique') === "true";

      if (fieldValue) {
        try {
          if (isUniqueField) {
            await validateField(fieldName, fieldValue);
            await saveField(fieldName, fieldValue);
            $(this).attr({disabled: true});
          } else {
            await saveField(fieldName, fieldValue);
          }
          $(this).siblings('.form-control').addClass('is-valid');
          $(this).addClass('is-valid');
          $(this).closest('.image-controller').addClass('is-valid');
        } catch (error) {
          $(this).siblings('.form-control').addClass('is-invalid');
          $(this).addClass('is-invalid');
          $(this).closest('.image-controller').addClass('is-invalid');
          alert(error.responseText || 'Server error - please contact us so we can fix the issue.');
        }
      } else {
        isValid = false;
        $(this).siblings('.form-control').addClass('is-invalid');
        $(this).addClass('is-invalid');
        $(this).closest('.image-controller').addClass('is-invalid');
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
  })
