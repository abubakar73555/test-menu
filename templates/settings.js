export function renderSettingsHTML(res, settings, info) {
  return `<!DOCTYPE html>
<html dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>تخصيص المنيو - ${res.res_name}</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: Tahoma, Arial, sans-serif; background: #f4f7f6; padding: 15px; margin:0; }
    .container { max-width: 600px; margin: auto; background: white; padding: 20px; border-radius: 10px; box-shadow:0 2px 10px rgba(0,0,0,0.1); }
    h2 { text-align: center; margin-bottom: 25px; }
    label { display: block; margin-top: 15px; font-weight: bold; }
    input, select, textarea { width: 100%; padding: 12px; margin-top: 5px; border: 1px solid #ddd; border-radius: 5px; font-size: 1rem; }
    textarea { min-height: 80px; }
    button { width: 100%; margin-top: 25px; padding: 12px; background: #007bff; color: white; border: none; border-radius: 5px; font-size: 1.1rem; cursor: pointer; }
    .logo-preview { max-width: 100%; max-height: 150px; margin: 10px 0; display: block; }
    hr { margin: 25px 0; }
    a { text-decoration: none; color: #007bff; display: inline-block; margin-top: 15px; }
    #toast { position: fixed; top: 20px; left: 50%; transform: translateX(-50%); background: #333; color: white; padding: 10px 20px; border-radius: 5px; display: none; z-index: 9999; }
  </style>
</head>
<body>
  <div id="toast"></div>
  <div class="container">
    <h2>⚙️ تخصيص المظهر ومعلومات المطعم</h2>
    <form method="POST" enctype="multipart/form-data" onsubmit="event.preventDefault(); uploadLogoAndSubmit(this);">

      <h3>🎨 المظهر</h3>
      <label>القالب (Theme):</label>
      <select name="theme">
        <option value="default" ${settings.theme_name==='default'?'selected':''}>افتراضي</option>
        <option value="dark" ${settings.theme_name==='dark'?'selected':''}>داكن</option>
        <option value="elegant" ${settings.theme_name==='elegant'?'selected':''}>أنيق</option>
      </select>

      <label>اللون الأساسي:</label>
      <input type="color" name="primary_color" value="${settings.primary_color}">

      <label>اللون الثانوي:</label>
      <input type="color" name="secondary_color" value="${settings.secondary_color}">

      <label>نوع الخط:</label>
      <select name="font_family">
        <option value="Tahoma" ${settings.font_family==='Tahoma'?'selected':''}>Tahoma</option>
        <option value="Arial" ${settings.font_family==='Arial'?'selected':''}>Arial</option>
        <option value="Cairo" ${settings.font_family==='Cairo'?'selected':''}>Cairo</option>
      </select>

      <label>شعار المطعم:</label>
      ${settings.logo_url ? `<img src="${settings.logo_url}" class="logo-preview">` : ''}
      <input type="file" name="logo" accept="image/*" id="logoInput">
      <input type="hidden" name="logo_url" id="logoUrl" value="${settings.logo_url}">

      <hr>

      <h3>📍 معلومات المطعم</h3>
      <label>رقم الهاتف:</label>
      <input type="text" name="phone" value="${info.phone || ''}" placeholder="مثال: 0123456789">

      <label>رقم واتساب:</label>
      <input type="text" name="whatsapp" value="${info.whatsapp || ''}" placeholder="مثال: 966501234567">

      <label>العنوان:</label>
      <textarea name="address">${info.address || ''}</textarea>

      <label>رابط الخريطة (iframe embed):</label>
      <input type="url" name="map_url" value="${info.map_url || ''}" placeholder="https://www.google.com/maps/embed?pb=...">

      <label>ساعات العمل:</label>
      <input type="text" name="working_hours" value="${info.working_hours || ''}" placeholder="مثال: 9 صباحاً - 11 مساءً">

      <label>رابط فيسبوك:</label>
      <input type="url" name="facebook" value="${info.facebook || ''}" placeholder="https://facebook.com/...">

      <label>رابط إنستغرام:</label>
      <input type="url" name="instagram" value="${info.instagram || ''}" placeholder="https://instagram.com/...">

      <h3>🪑 إعدادات الطاولات</h3>
      <label>عدد الطاولات:</label>
      <input type="number" name="number_of_tables" value="${info.number_of_tables || 5}" min="1" max="50" required>

      <button type="submit">حفظ الإعدادات</button>
    </form>
    <br>
    <a href="/admin/${res.slug}">🔙 العودة</a>
  </div>

  <script>
    function showToast(message, type = 'success') {
      const toast = document.getElementById('toast');
      toast.style.backgroundColor = type === 'success' ? '#28a745' : '#dc3545';
      toast.innerText = message;
      toast.style.display = 'block';
      setTimeout(() => { toast.style.display = 'none'; }, 3000);
    }

    async function uploadLogoAndSubmit(form) {
      const submitBtn = form.querySelector('button[type="submit"]');
      const originalText = submitBtn.innerText;
      submitBtn.disabled = true;
      submitBtn.innerText = 'جاري الرفع...';

      const fileInput = form.querySelector('#logoInput');
      const logoUrlInput = form.querySelector('#logoUrl');
      
      if (fileInput.files.length > 0) {
        const formData = new FormData();
        formData.append('image', fileInput.files[0]);
        formData.append('restaurant_id', ${res.id});
        
        try {
          const response = await fetch('/upload/image', { method: 'POST', body: formData });
          const data = await response.json();
          if (data.error) {
            showToast(data.error, 'error');
          } else {
            logoUrlInput.value = data.url;
            form.submit();
          }
        } catch (err) {
          showToast('حدث خطأ: ' + err.message, 'error');
        } finally {
          submitBtn.disabled = false;
          submitBtn.innerText = originalText;
        }
      } else {
        form.submit();
      }
    }

    window.onload = function() {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('success')) {
        showToast(urlParams.get('success'), 'success');
      } else if (urlParams.get('error')) {
        showToast(urlParams.get('error'), 'error');
      }
    }
  </script>
</body>
</html>`;
}