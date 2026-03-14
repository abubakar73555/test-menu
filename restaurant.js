// ==========================================
// restaurant.js - إدارة المطعم والفئات والإعدادات وخيارات الأطباق
// ==========================================
import { logActivity, safeUrl, formatDate } from './utils.js';
import { getRestaurantBySlug, getRestaurantSettings, getRestaurantInfo } from './db.js';

// ==========================================
// 1. لوحة تحكم المطعم (الوجبات)
// ==========================================
export async function handleRestaurantRoute(request, env, slug, origin) {
  const cookie = request.headers.get("Cookie") || "";
  const isMaster = cookie.includes("auth_role=master");
  const isOwner = cookie.includes(`auth_role=res_${slug}`);
  if (!isMaster && !isOwner) return Response.redirect(new URL("/", request.url));

  const res = await getRestaurantBySlug(env, slug);
  if (!res) return new Response("المطعم غير موجود", { status: 404 });

  const { results: categories } = await env.DB.prepare(
    "SELECT * FROM categories WHERE restaurant_id = ? ORDER BY sort_order, name"
  ).bind(res.id).all();

  const info = await getRestaurantInfo(env, res.id);

  // ========== معالجة إجراءات الطاولات ==========
  if (request.method === "POST") {
    const data = await request.formData();
    const action = data.get("action");

    // إجراءات الوجبات (موجودة مسبقاً)
    if (action === "add") {
      const name = data.get("name");
      const price = data.get("price");
      const categoryId = data.get("category_id") || null;
      const imageUrl = data.get("image_url") || null;
      const featured = data.get("featured") ? 1 : 0;

      await env.DB.prepare(
        "INSERT INTO items (restaurant_id, name, price, category_id, image_url, featured) VALUES (?, ?, ?, ?, ?, ?)"
      ).bind(res.id, name, price, categoryId, imageUrl, featured).run();
      await logActivity(env, res.id, "item_add", `أضاف وجبة ${name}`);

    } else if (action === "edit") {
      const itemId = data.get("id");
      const name = data.get("name");
      const price = data.get("price");
      const categoryId = data.get("category_id");
      const imageUrl = data.get("image_url");
      const featured = data.get("featured") ? 1 : 0;

      await env.DB.prepare(
        "UPDATE items SET name = ?, price = ?, category_id = ?, image_url = ?, featured = ? WHERE id = ?"
      ).bind(name, price, categoryId, imageUrl, featured, itemId).run();
      await logActivity(env, res.id, "item_edit", `عدل وجبة ${name}`);

    } else if (action === "delete") {
      const itemId = data.get("id");
      await env.DB.prepare("DELETE FROM items WHERE id = ?").bind(itemId).run();
      await logActivity(env, res.id, "item_delete", `حذف وجبة ID: ${itemId}`);
    }

    // ========== إجراءات الطاولات الجديدة ==========
    else if (action === "add_table") {
      const tableName = data.get("table_name");
      await env.DB.prepare(
        "INSERT INTO tables (restaurant_id, table_name) VALUES (?, ?)"
      ).bind(res.id, tableName).run();
      await logActivity(env, res.id, "table_add", `أضاف طاولة ${tableName}`);

    } else if (action === "edit_table") {
      const tableId = data.get("table_id");
      const tableName = data.get("table_name");
      await env.DB.prepare(
        "UPDATE tables SET table_name = ? WHERE id = ? AND restaurant_id = ?"
      ).bind(tableName, tableId, res.id).run();
      await logActivity(env, res.id, "table_edit", `عدل اسم طاولة إلى ${tableName}`);

    } else if (action === "delete_table") {
      const tableId = data.get("table_id");
      await env.DB.prepare(
        "DELETE FROM tables WHERE id = ? AND restaurant_id = ?"
      ).bind(tableId, res.id).run();
      await logActivity(env, res.id, "table_delete", `حذف طاولة`);
    }

    return Response.redirect(new URL(`/admin/${slug}`, request.url));
  }

  // جلب الوجبات
  const { results: items } = await env.DB.prepare(`
    SELECT items.*, categories.name as category_name 
    FROM items 
    LEFT JOIN categories ON items.category_id = categories.id 
    WHERE items.restaurant_id = ?
    ORDER BY items.featured DESC, categories.sort_order, categories.name, items.name
  `).bind(res.id).all();

  // جلب الطاولات من قاعدة البيانات
  const { results: tables } = await env.DB.prepare(
    "SELECT * FROM tables WHERE restaurant_id = ? ORDER BY id"
  ).bind(res.id).all();

  const settings = await getRestaurantSettings(env, res.id);

  return new Response(renderRestaurantHTML(res, items, categories, settings, origin, info, tables), {
    headers: { "Content-Type": "text/html; charset=utf-8" }
  });
}

function renderRestaurantHTML(res, items, categories, settings, origin, info, tables) {
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

  // ========== عرض الطاولات مع إمكانية الإدارة ==========
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
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>إدارة ${res.res_name}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: ${settings.font_family}, Tahoma, Arial; padding: 15px; background: #f8f9fa; margin:0; }
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
  @media (max-width: 600px) {
    .header { flex-direction: column; align-items: start; }
    .qr-img { align-self: center; }
    .add-form input, .add-form select, .add-form button { width: 100%; margin: 5px 0; }
  }
</style>
</head>
<body>
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

    <!-- ========== إدارة الطاولات (مطورة) ========== -->
    <div class="qr-tables">
      <h3>🪑 إدارة الطاولات</h3>
      <p>يمكنك إضافة وتعديل وحذف الطاولات، واستخدام الرابط المخصص لكل طاولة لإنشاء QR code.</p>
      
      <!-- قائمة الطاولات -->
      <div style="margin-bottom:15px;">
        ${tablesHtml || '<p style="color:#666;">لا توجد طاولات مضافة بعد.</p>'}
      </div>

      <!-- نموذج إضافة طاولة جديدة -->
      <form method="POST" style="display:flex; gap:5px; margin-top:10px;">
        <input type="hidden" name="action" value="add_table">
        <input type="text" name="table_name" placeholder="اسم الطاولة (مثال: طاولة 4)" required style="flex:1; padding:8px; border:1px solid #ddd; border-radius:5px;">
        <button type="submit" style="background:#28a745; color:white; border:none; padding:8px 15px; border-radius:5px; cursor:pointer;">➕ إضافة طاولة</button>
      </form>

      <!-- نافذة تعديل الطاولة (ستظهر عبر JavaScript) -->
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
    async function uploadImageAndSubmit(form) {
      const fileInput = form.querySelector('#imageInput');
      const imageUrlInput = form.querySelector('#imageUrl');
      
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

    // دوال إدارة الطاولات
    function editTable(id, name) {
      document.getElementById('editTableId').value = id;
      document.getElementById('editTableName').value = name;
      document.getElementById('editTableModal').style.display = 'flex';
    }

    // إغلاق النافذة إذا نقر المستخدم خارجها
    window.onclick = function(event) {
      if (event.target.classList.contains('modal')) {
        event.target.style.display = 'none';
      }
    }
  </script>
</body>
</html>`;
}

// ==========================================
// 2. إدارة الفئات
// ==========================================
export async function handleCategoriesRoute(request, env, slug) {
  const cookie = request.headers.get("Cookie") || "";
  const isMaster = cookie.includes("auth_role=master");
  const isOwner = cookie.includes(`auth_role=res_${slug}`);
  if (!isMaster && !isOwner) return Response.redirect(new URL("/", request.url));

  const res = await getRestaurantBySlug(env, slug);
  if (!res) return new Response("المطعم غير موجود", { status: 404 });

  if (request.method === "POST") {
    const data = await request.formData();
    const action = data.get("action");

    if (action === "add") {
      const name = data.get("name");
      await env.DB.prepare(
        "INSERT INTO categories (restaurant_id, name, sort_order) VALUES (?, ?, ?)"
      ).bind(res.id, name, 0).run();
      await logActivity(env, res.id, "category_add", `أضاف فئة ${name}`);
    } else if (action === "delete") {
      const catId = data.get("id");
      await env.DB.prepare("DELETE FROM categories WHERE id = ?").bind(catId).run();
      await logActivity(env, res.id, "category_delete", `حذف فئة ID: ${catId}`);
    } else if (action === "edit") {
      const catId = data.get("id");
      const name = data.get("name");
      await env.DB.prepare("UPDATE categories SET name = ? WHERE id = ?").bind(name, catId).run();
      await logActivity(env, res.id, "category_edit", `عدل فئة إلى ${name}`);
    }

    return Response.redirect(new URL(`/admin/${slug}/categories`, request.url));
  }

  const { results: categories } = await env.DB.prepare(
    "SELECT * FROM categories WHERE restaurant_id = ? ORDER BY sort_order, name"
  ).bind(res.id).all();

  return new Response(renderCategoriesHTML(res, categories), {
    headers: { "Content-Type": "text/html; charset=utf-8" }
  });
}

function renderCategoriesHTML(res, categories) {
  const rows = categories.map(c => `
    <tr>
      <td data-label="اسم الفئة">${c.name}</td>
      <td data-label="الإجراءات">
        <div style="display:flex; gap:5px; flex-wrap:wrap;">
          <button onclick="openEditCatModal(${c.id}, '${c.name.replace(/'/g, "\\'")}')" style="background:orange; color:white; border:none; padding:5px 10px; border-radius:3px;">تعديل</button>
          <form method="POST" style="display:inline;" onsubmit="return confirm('سيتم إزالة الفئة من الوجبات المرتبطة. استمر؟');">
            <input type="hidden" name="action" value="delete">
            <input type="hidden" name="id" value="${c.id}">
            <button style="background:red; color:white; border:none; padding:5px 10px; border-radius:3px;">حذف</button>
          </form>
        </div>
      </td>
    </tr>
  `).join('');

  return `<!DOCTYPE html>
<html dir="rtl">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>إدارة الفئات - ${res.res_name}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: Tahoma, Arial, sans-serif; background: #f4f7f6; padding: 15px; margin:0; }
  .container { max-width: 600px; margin: auto; background: white; padding: 20px; border-radius: 10px; box-shadow:0 2px 10px rgba(0,0,0,0.1); }
  h2 { font-size: 1.5rem; margin-bottom: 20px; text-align: center; }
  form.add-form { display: flex; gap: 10px; margin-bottom: 20px; flex-wrap: wrap; }
  form.add-form input { flex: 1; min-width: 200px; padding: 10px; border: 1px solid #ddd; border-radius: 5px; }
  form.add-form button { padding: 10px 20px; background: #28a745; color: white; border: none; border-radius: 5px; cursor: pointer; }
  table { width: 100%; border-collapse: collapse; }
  th { background: #f0f0f0; padding: 12px; text-align: right; }
  td { padding: 12px; border-bottom: 1px solid #eee; }
  .modal { display: none; position: fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.5); justify-content:center; align-items:center; z-index:1000; }
  .modal-content { background: white; padding: 25px; border-radius: 10px; width: 90%; max-width: 400px; }
  .modal-content input { width: 100%; padding: 10px; margin: 10px 0; border: 1px solid #ddd; border-radius: 5px; }
  .modal-content button { padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; }
  a { text-decoration: none; color: #007bff; }
  @media (max-width: 600px) {
    table, thead, tbody, th, td, tr { display: block; }
    thead tr { position: absolute; top: -9999px; left: -9999px; }
    tr { margin-bottom: 15px; border: 1px solid #ddd; border-radius: 8px; overflow: hidden; }
    td { display: flex; justify-content: space-between; align-items: center; padding: 10px; border-bottom: 1px solid #eee; }
    td:last-child { border-bottom: none; }
    td:before { content: attr(data-label); font-weight: bold; margin-left: 10px; color: #555; width: 40%; }
    form.add-form input { width: 100%; }
    form.add-form button { width: 100%; }
  }
</style>
</head>
<body>
  <div class="container">
    <h2>📁 إدارة الفئات - ${res.res_name}</h2>
    <form class="add-form" method="POST">
      <input type="hidden" name="action" value="add">
      <input type="text" name="name" placeholder="اسم الفئة" required>
      <button type="submit">إضافة فئة</button>
    </form>
    <table>
      <thead><tr><th>اسم الفئة</th><th>الإجراءات</th></tr></thead>
      <tbody>${rows || '<tr><td colspan="2" style="text-align:center;">لا توجد فئات</td></tr>'}</tbody>
    </table>
    <br>
    <a href="/admin/${res.slug}">🔙 العودة للوحة المطعم</a>
  </div>

  <div id="editCatModal" class="modal" onclick="if(event.target===this) this.style.display='none'">
    <div class="modal-content">
      <h3>✏️ تعديل الفئة</h3>
      <form method="POST">
        <input type="hidden" name="action" value="edit">
        <input type="hidden" name="id" id="editCatId">
        <input type="text" name="name" id="editCatName" required>
        <div style="display:flex; gap:10px; justify-content:flex-end;">
          <button type="button" onclick="document.getElementById('editCatModal').style.display='none'" style="background:#6c757d; color:white;">إلغاء</button>
          <button type="submit" style="background:#007bff; color:white;">حفظ</button>
        </div>
      </form>
    </div>
  </div>

  <script>
    function openEditCatModal(id, name) {
      document.getElementById('editCatId').value = id;
      document.getElementById('editCatName').value = name;
      document.getElementById('editCatModal').style.display = 'flex';
    }
  </script>
</body>
</html>`;
}

// ==========================================
// 3. إعدادات المطعم (المظهر ومعلومات المطعم)
// ==========================================
export async function handleSettingsRoute(request, env, slug) {
  const cookie = request.headers.get("Cookie") || "";
  const isMaster = cookie.includes("auth_role=master");
  const isOwner = cookie.includes(`auth_role=res_${slug}`);
  if (!isMaster && !isOwner) return Response.redirect(new URL("/", request.url));

  const res = await getRestaurantBySlug(env, slug);
  if (!res) return new Response("المطعم غير موجود", { status: 404 });

  let info = await env.DB.prepare("SELECT * FROM restaurant_info WHERE restaurant_id = ?").bind(res.id).first();
  if (!info) {
    info = { phone: '', whatsapp: '', address: '', map_url: '', working_hours: '', facebook: '', instagram: '', number_of_tables: 5 };
  }

  if (request.method === "POST") {
    const data = await request.formData();
    const theme = data.get("theme");
    const primary = data.get("primary_color");
    const secondary = data.get("secondary_color");
    const font = data.get("font_family");
    const logoUrl = data.get("logo_url");

    await env.DB.prepare(`
      INSERT INTO restaurant_settings (restaurant_id, theme_name, primary_color, secondary_color, font_family, logo_url)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(restaurant_id) DO UPDATE SET
        theme_name=excluded.theme_name,
        primary_color=excluded.primary_color,
        secondary_color=excluded.secondary_color,
        font_family=excluded.font_family,
        logo_url=excluded.logo_url
    `).bind(res.id, theme, primary, secondary, font, logoUrl).run();

    const phone = data.get("phone") || '';
    const whatsapp = data.get("whatsapp") || '';
    const address = data.get("address") || '';
    const map_url = data.get("map_url") || '';
    const working_hours = data.get("working_hours") || '';
    const facebook = data.get("facebook") || '';
    const instagram = data.get("instagram") || '';
    const number_of_tables = parseInt(data.get("number_of_tables")) || 5;

    await env.DB.prepare(`
      INSERT INTO restaurant_info (restaurant_id, phone, whatsapp, address, map_url, working_hours, facebook, instagram, number_of_tables)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(restaurant_id) DO UPDATE SET
        phone=excluded.phone,
        whatsapp=excluded.whatsapp,
        address=excluded.address,
        map_url=excluded.map_url,
        working_hours=excluded.working_hours,
        facebook=excluded.facebook,
        instagram=excluded.instagram,
        number_of_tables=excluded.number_of_tables
    `).bind(res.id, phone, whatsapp, address, map_url, working_hours, facebook, instagram, number_of_tables).run();

    return Response.redirect(new URL(`/admin/${slug}/settings`, request.url));
  }

  const settings = await getRestaurantSettings(env, res.id);

  return new Response(renderSettingsHTML(res, settings, info), {
    headers: { "Content-Type": "text/html; charset=utf-8" }
  });
}

function renderSettingsHTML(res, settings, info) {
  return `<!DOCTYPE html>
<html dir="rtl">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>تخصيص المنيو - ${res.res_name}</title>
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
</style>
</head>
<body>
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
    async function uploadLogoAndSubmit(form) {
      const fileInput = form.querySelector('#logoInput');
      const logoUrlInput = form.querySelector('#logoUrl');
      
      if (fileInput.files.length > 0) {
        const formData = new FormData();
        formData.append('image', fileInput.files[0]);
        formData.append('restaurant_id', ${res.id});
        
        const response = await fetch('/upload/image', { method: 'POST', body: formData });
        const data = await response.json();
        if (data.error) {
          alert(data.error);
        } else {
          logoUrlInput.value = data.url;
          form.submit();
        }
      } else {
        form.submit();
      }
    }
  </script>
</body>
</html>`;
}

// ==========================================
// 4. إدارة خيارات الأطباق
// ==========================================
export async function handleItemOptionsRoute(request, env, slug, itemId) {
  const cookie = request.headers.get("Cookie") || "";
  const isMaster = cookie.includes("auth_role=master");
  const isOwner = cookie.includes(`auth_role=res_${slug}`);
  if (!isMaster && !isOwner) return Response.redirect(new URL("/", request.url));

  const res = await getRestaurantBySlug(env, slug);
  if (!res) return new Response("المطعم غير موجود", { status: 404 });

  const item = await env.DB.prepare("SELECT * FROM items WHERE id = ? AND restaurant_id = ?").bind(itemId, res.id).first();
  if (!item) return new Response("الوجبة غير موجودة", { status: 404 });

  if (request.method === "POST") {
    const data = await request.formData();
    const action = data.get("action");

    if (action === "add") {
      const optionName = data.get("option_name");
      const optionPrice = parseFloat(data.get("option_price")) || 0;
      await env.DB.prepare(
        "INSERT INTO item_options (item_id, option_name, option_price) VALUES (?, ?, ?)"
      ).bind(itemId, optionName, optionPrice).run();
      await logActivity(env, res.id, "option_add", `أضاف خيار ${optionName} لوجبة ${item.name}`);
    } else if (action === "delete") {
      const optionId = data.get("option_id");
      await env.DB.prepare("DELETE FROM item_options WHERE id = ?").bind(optionId).run();
      await logActivity(env, res.id, "option_delete", `حذف خيار من وجبة ${item.name}`);
    }

    return Response.redirect(new URL(`/admin/${slug}/item-options/${itemId}`, request.url));
  }

  const { results: options } = await env.DB.prepare(
    "SELECT * FROM item_options WHERE item_id = ? ORDER BY option_name"
  ).bind(itemId).all();

  return new Response(renderItemOptionsHTML(res, item, options), {
    headers: { "Content-Type": "text/html; charset=utf-8" }
  });
}

function renderItemOptionsHTML(res, item, options) {
  const rows = options.map(o => `
    <tr>
      <td>${o.option_name}</td>
      <td>${o.option_price > 0 ? o.option_price + ' ريال' : 'مجاني'}</td>
      <td>
        <form method="POST" style="display:inline;" onsubmit="return confirm('حذف هذا الخيار؟');">
          <input type="hidden" name="action" value="delete">
          <input type="hidden" name="option_id" value="${o.id}">
          <button style="background:red; color:white; border:none; padding:5px 10px; border-radius:3px; cursor:pointer;">حذف</button>
        </form>
      </td>
    </tr>
  `).join('');

  return `<!DOCTYPE html>
<html dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>خيارات ${item.name} - ${res.res_name}</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: 'Tahoma', Arial, sans-serif; background: #f4f7f6; padding: 15px; margin:0; }
    .container { max-width: 600px; margin: auto; background: white; padding: 20px; border-radius: 10px; box-shadow:0 2px 10px rgba(0,0,0,0.1); }
    h2 { text-align: center; color: #333; margin-bottom: 20px; }
    .add-form { display: flex; gap: 10px; margin-bottom: 20px; flex-wrap: wrap; background: #f9f9f9; padding: 15px; border-radius: 8px; }
    .add-form input, .add-form button { padding: 10px; border: 1px solid #ddd; border-radius: 5px; font-size: 1rem; }
    .add-form input[type="text"] { flex: 2; min-width: 200px; }
    .add-form input[type="number"] { flex: 1; min-width: 100px; }
    .add-form button { background: #28a745; color: white; border: none; cursor: pointer; }
    table { width: 100%; border-collapse: collapse; margin-top: 15px; }
    th { background: #f0f0f0; padding: 10px; text-align: right; }
    td { padding: 10px; border-bottom: 1px solid #eee; }
    .btn-back { display: inline-block; margin-top: 20px; padding: 10px 20px; background: #007bff; color: white; text-decoration: none; border-radius: 5px; }
    .btn-back:hover { opacity: 0.9; }
    @media (max-width: 600px) {
      .add-form input { width: 100%; }
      .add-form button { width: 100%; }
    }
  </style>
</head>
<body>
  <div class="container">
    <h2>⚙️ خيارات إضافية لـ "${item.name}"</h2>
    <p style="text-align:center; color:#666;">أضف خيارات مثل: إضافة جبنة، بدون بصل، حجم كبير... (يمكن إضافة سعر إضافي)</p>
    
    <form method="POST" class="add-form">
      <input type="hidden" name="action" value="add">
      <input type="text" name="option_name" placeholder="اسم الخيار (مثال: إضافة جبنة)" required>
      <input type="number" name="option_price" placeholder="السعر الإضافي" step="0.01" min="0" value="0">
      <button type="submit">➕ إضافة خيار</button>
    </form>

    <table>
      <thead>
        <tr>
          <th>الخيار</th>
          <th>السعر الإضافي</th>
          <th>الإجراء</th>
        </tr>
      </thead>
      <tbody>
        ${rows || '<tr><td colspan="3" style="text-align:center;">لا توجد خيارات لهذه الوجبة</td></tr>'}
      </tbody>
    </table>
    
    <a href="/admin/${res.slug}" class="btn-back">🔙 العودة للوحة المطعم</a>
  </div>
</body>
</html>`;
}
