// ==========================================
// قالب لوحة تحكم المطعم
// ==========================================
export function renderRestaurantHTML(res, items, categories, settings, origin, info, tables) {
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
      <button onclick="editTable(${t.id}, '${t.table_name}')" style="background:orange; color:white; border:none; padding:2px 8px; border-radius:3px;">✏️</button>
      <form method="POST" style="display:inline;" onsubmit="return confirm('حذف هذه الطاولة؟');">
        <input type="hidden" name="action" value="delete_table">
        <input type="hidden" name="table_id" value="${t.id}">
        <button style="background:red; color:white; border:none; padding:2px 8px; border-radius:3px;">🗑️</button>
      </form>
      <a href="/menu/${res.slug}?table=${t.id}" target="_blank" style="background:${settings.primary_color}; color:white; padding:2px 8px; border-radius:3px; text-decoration:none;">🔗</a>
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
    /* هنا ضع كل الـ CSS السابق مع إضافة toast */
    #toast { position: fixed; top: 20px; left: 50%; transform: translateX(-50%); background: #333; color: white; padding: 10px 20px; border-radius: 5px; display: none; z-index: 9999; }
    /* باقي الـ CSS كما هو */
  </style>
</head>
<body>
  <div id="toast"></div>
  <div class="container">
    <!-- كل المحتوى السابق -->
  </div>

  <script>
    function showToast(message, type = 'success') {
      const toast = document.getElementById('toast');
      toast.style.backgroundColor = type === 'success' ? '#28a745' : '#dc3545';
      toast.innerText = message;
      toast.style.display = 'block';
      setTimeout(() => { toast.style.display = 'none'; }, 3000);
    }

    // دوال رفع الصور مع toast
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

    // دوال التعديل وغيرها
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