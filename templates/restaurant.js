// ==========================================
// قالب لوحة تحكم المطعم
// ==========================================
export function renderRestaurantHTML(res, items, categories, settings, origin, info, tables) {
  // التحقق من المدخلات
  if (!res || !res.res_name) {
    return `<h1>خطأ: بيانات المطعم غير مكتملة</h1>`;
  }
  if (!Array.isArray(items)) items = [];
  if (!Array.isArray(categories)) categories = [];
  if (!settings) settings = {};
  if (!info) info = {};
  if (!Array.isArray(tables)) tables = [];

  const menuUrl = `${origin}/menu/${res.slug}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(menuUrl)}`;

  const catOptions = categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('');

  const itemsList = items.map(i => `
    <li style="padding:10px; border-bottom:1px solid #eee; display:flex; align-items:center; gap:10px; flex-wrap:wrap; ${i.featured ? 'background: #fff3cd;' : ''}">
      ${i.image_url ? `<img src="${i.image_url}" style="width:50px; height:50px; object-fit:cover; border-radius:5px;">` : ''}
      <div style="flex:1; min-width:120px;">
        <strong>${i.name}</strong> - ${i.price} ريال
        ${i.category_name ? `<br><small>فئة: ${i.category_name}</small>` : ''}
        ${i.featured ? `<br><small style="color:orange;">⭐ مميز</small>` : ''}
      </div>
      <div style="display:flex; gap:5px;">
        <button onclick="location.href='/admin/${res.slug}/item-options/${i.id}'" style="background:#17a2b8; color:white; border:none; padding:5px 10px; border-radius:3px; cursor:pointer;">⚙️ خيارات</button>
        <button onclick="openEditItemModal(${i.id}, '${i.name.replace(/'/g, "\\'")}', ${i.price}, ${i.category_id || 'null'}, '${i.image_url || ''}', ${i.featured})" style="background:orange; color:white; border:none; padding:5px 10px; border-radius:3px;">تعديل</button>
        <form method="POST" style="margin:0;" onsubmit="return confirm('حذف الوجبة؟');">
          <input type="hidden" name="action" value="delete">
          <input type="hidden" name="id" value="${i.id}">
          <button style="background:red; color:white; border:none; padding:5px 10px; border-radius:3px;">حذف</button>
        </form>
      </div>
    </li>
  `).join('');

  const tablesHtml = tables.map(t => `
    <div style="display:flex; align-items:center; gap:5px; margin:5px; background:#f9f9f9; padding:5px; border-radius:5px; flex-wrap:wrap;">
      <span style="flex:1;">${t.table_name}</span>
      <button onclick="editTable(${t.id}, '${t.table_name.replace(/'/g, "\\'")}')" style="background:orange; color:white; border:none; padding:2px 8px; border-radius:3px;">✏️</button>
      <form method="POST" style="display:inline;" onsubmit="return confirm('حذف هذه الطاولة؟');">
        <input type="hidden" name="action" value="delete_table">
        <input type="hidden" name="table_id" value="${t.id}">
        <button style="background:red; color:white; border:none; padding:2px 8px; border-radius:3px;">🗑️</button>
      </form>
      <a href="/menu/${res.slug}?table=${t.id}" target="_blank" style="background:${settings.primary_color || '#007bff'}; color:white; padding:2px 8px; border-radius:3px; text-decoration:none;">🔗</a>
      <a href="https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(origin + '/menu/' + res.slug + '?table=' + t.id)}" 
         target="_blank" 
         title="تحميل QR للطباعة (بحجم كبير)" 
         style="background:#28a745; color:white; padding:2px 8px; border-radius:3px; text-decoration:none;">🖨️</a>
      <img src="https://api.qrserver.com/v1/create-qr-code/?size=60x60&data=${encodeURIComponent(origin + '/menu/' + res.slug + '?table=' + t.id)}" 
           style="width:50px; height:50px; border-radius:5px; cursor:pointer;" 
           title="QR code لـ ${t.table_name}" 
           onclick="window.open('${origin + '/menu/' + res.slug + '?table=' + t.id}')">
    </div>
  `).join('');

  return `<!DOCTYPE html>
<html dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>إدارة ${res.res_name}</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: ${settings.font_family || 'Tahoma'}, Tahoma, Arial; padding: 15px; background: #f8f9fa; margin:0; }
    .container { max-width: 800px; margin: auto; background: white; padding: 20px; border-radius: 10px; box-shadow:0 2px 10px rgba(0,0,0,0.1); }
    .header { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 15px; margin-bottom: 15px; }
    .logo-img { max-height: 50px; }
    .qr-img { border:1px solid #ddd; padding:5px; border-radius:5px; max-width: 100px; }
    .add-form { background: #f9f9f9; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
    .add-form input, .add-form select, .add-form button { padding: 10px; margin: 5px; border:1px solid #ddd; border-radius:5px; width: calc(100% - 10px); }
    .qr-tables { background: #f0f0f0; padding: 15px; border-radius: 8px; margin: 20px 0; }
    .qr-tables a { display: inline-block; margin: 5px; }
    ul { list-style: none; padding: 0; }
    .modal { display: none; position: fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.5); justify-content:center; align-items:center; z-index:1000; }
    .modal-content { background: white; padding: 20px; border-radius: 10px; width: 90%; max-width: 500px; max-height: 80vh; overflow-y: auto; }
    .logout-btn { background: #6c757d; color: white; border: none; padding: 12px; border-radius: 5px; cursor: pointer; width: 100%; margin-top: 20px; }
    #toast { position: fixed; top: 20px; left: 50%; transform: translateX(-50%); background: #333; color: white; padding: 10px 20px; border-radius: 5px; display: none; z-index: 9999; }
    @media (max-width: 600px) {
      .header { flex-direction: column; align-items: start; }
      .qr-img { align-self: center; }
      .add-form input, .add-form select, .add-form button { width: 100%; margin: 5px 0; }
    }
  </style>
</head>
<body>
  <div id="toast"></div>
  <div class="container">
    <div class="header">
      <div>
        <h2>🍴 إدارة: ${res.res_name}</h2>
        ${settings.logo_url ? `<img src="${settings.logo_url}" class="logo-img">` : ''}
      </div>
      <img src="${qrUrl}" class="qr-img">
    </div>
    <p>رابط المنيو: <a href="${menuUrl}" target="_blank">${menuUrl}</a></p>
    <p><a href="/admin/${res.slug}/categories">📁 إدارة الفئات</a> | <a href="/admin/${res.slug}/settings">⚙️ تخصيص المظهر</a></p>
    <hr>

    <div class="add-form">
      <h3>➕ إضافة وجبة جديدة</h3>
      <form method="POST" enctype="multipart/form-data" onsubmit="event.preventDefault(); uploadImageAndSubmit(this);">
        <input type="hidden" name="action" value="add">
        <input type="text" name="name" placeholder="اسم الوجبة" required>
        <input type="number" name="price" placeholder="السعر" required>
        <select name="category_id">
          <option value="">بدون فئة</option>
          ${catOptions}
        </select>
        <input type="file" name="image" accept="image/*" id="imageInput">
        <label style="display:flex; align-items:center; gap:5px;">
          <input type="checkbox" name="featured" value="1"> ⭐ وجبة مميزة
        </label>
        <input type="hidden" name="image_url" id="imageUrl">
        <button type="submit" style="background:#28a745; color:white;">إضافة</button>
      </form>
    </div>

    <div class="qr-tables">
      <h3>🪑 إدارة الطاولات</h3>
      <p>يمكنك إضافة وتعديل وحذف الطاولات، واستخدام الرابط المخصص لكل طاولة لإنشاء QR code.</p>
      
      <div style="margin-bottom:15px;">
        ${tablesHtml || '<p style="color:#666;">لا توجد طاولات مضافة بعد.</p>'}
      </div>

      <form method="POST" style="display:flex; gap:5px; margin-top:10px;">
        <input type="hidden" name="action" value="add_table">
        <input type="text" name="table_name" placeholder="اسم الطاولة (مثال: طاولة 4)" required style="flex:1; padding:8px; border:1px solid #ddd; border-radius:5px;">
        <button type="submit" style="background:#28a745; color:white; border:none; padding:8px 15px; border-radius:5px; cursor:pointer;">➕ إضافة طاولة</button>
      </form>

      <div id="editTableModal" class="modal" onclick="if(event.target===this) this.style.display='none'">
        <div class="modal-content">
          <h3>✏️ تعديل اسم الطاولة</h3>
          <form method="POST" id="editTableForm">
            <input type="hidden" name="action" value="edit_table">
            <input type="hidden" name="table_id" id="editTableId">
            <input type="text" name="table_name" id="editTableName" required style="width:100%; padding:8px; margin:10px 0;">
            <div style="display:flex; gap:10px; justify-content:flex-end;">
              <button type="button" onclick="document.getElementById('editTableModal').style.display='none'" style="background:#6c757d; color:white; border:none; padding:8px 15px; border-radius:5px;">إلغاء</button>
              <button type="submit" style="background:#007bff; color:white; border:none; padding:8px 15px; border-radius:5px;">حفظ</button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <ul>${itemsList || '<p style="text-align:center;">لا توجد وجبات بعد</p>'}</ul>

    <div id="editItemModal" class="modal">
      <div class="modal-content">
        <h3>✏️ تعديل الوجبة</h3>
        <form method="POST" enctype="multipart/form-data" onsubmit="event.preventDefault(); updateItem(this);">
          <input type="hidden" name="action" value="edit">
          <input type="hidden" name="id" id="editItemId">
          <label>الاسم:</label>
          <input type="text" name="name" id="editItemName" required>
          <label>السعر:</label>
          <input type="number" name="price" id="editItemPrice" required>
          <label>الفئة:</label>
          <select name="category_id" id="editItemCategory">${catOptions}</select>
          <label>الصورة الحالية:</label>
          <img id="editItemImagePreview" style="max-width:100%; max-height:150px; margin:10px 0;">
          <label>تغيير الصورة:</label>
          <input type="file" name="image" accept="image/*" id="editImageInput">
          <label style="display:flex; align-items:center; gap:5px;">
            <input type="checkbox" name="featured" id="editFeatured" value="1"> ⭐ وجبة مميزة
          </label>
          <input type="hidden" name="image_url" id="editImageUrl">
          <div style="display:flex; gap:10px; margin-top:15px;">
            <button type="button" onclick="closeEditModal()" style="flex:1; background:#6c757d; color:white; padding:10px;">إلغاء</button>
            <button type="submit" style="flex:1; background:#007bff; color:white; padding:10px;">حفظ</button>
          </div>
        </form>
      </div>
    </div>

    <button class="logout-btn" onclick="document.cookie='auth_role=; Max-Age=0; path=/;'; location.href='/';">تسجيل خروج</button>
  </div>

  <script>
    function showToast(message, type = 'success') {
      const toast = document.getElementById('toast');
      toast.style.backgroundColor = type === 'success' ? '#28a745' : '#dc3545';
      toast.innerText = message;
      toast.style.display = 'block';
      setTimeout(() => { toast.style.display = 'none'; }, 3000);
    }

    async function uploadImageAndSubmit(form) {
      const submitBtn = form.querySelector('button[type="submit"]');
      const originalText = submitBtn.innerText;
      submitBtn.disabled = true;
      submitBtn.innerText = 'جاري الرفع...';

      const fileInput = form.querySelector('#imageInput');
      const imageUrlInput = form.querySelector('#imageUrl');
      
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
            imageUrlInput.value = data.url;
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

    async function updateItem(form) {
      const fileInput = form.querySelector('#editImageInput');
      const imageUrlInput = form.querySelector('#editImageUrl');
      
      if (fileInput.files.length > 0) {
        const formData = new FormData();
        formData.append('image', fileInput.files[0]);
        formData.append('restaurant_id', ${res.id});
        
        const response = await fetch('/upload/image', { method: 'POST', body: formData });
        const data = await response.json();
        if (data.error) {
          alert(data.error);
        } else {
          imageUrlInput.value = data.url;
          form.submit();
        }
      } else {
        form.submit();
      }
    }

    function openEditItemModal(id, name, price, categoryId, imageUrl, featured) {
      document.getElementById('editItemId').value = id;
      document.getElementById('editItemName').value = name;
      document.getElementById('editItemPrice').value = price;
      document.getElementById('editItemCategory').value = categoryId || '';
      document.getElementById('editItemImagePreview').src = imageUrl || '';
      document.getElementById('editImageUrl').value = imageUrl || '';
      document.getElementById('editFeatured').checked = featured == 1;
      document.getElementById('editItemModal').style.display = 'flex';
    }

    function closeEditModal() {
      document.getElementById('editItemModal').style.display = 'none';
    }

    function editTable(id, name) {
      document.getElementById('editTableId').value = id;
      document.getElementById('editTableName').value = name;
      document.getElementById('editTableModal').style.display = 'flex';
    }

    window.onclick = function(event) {
      if (event.target.classList.contains('modal')) {
        event.target.style.display = 'none';
      }
    }
  </script>
</body>
</html>`;
}