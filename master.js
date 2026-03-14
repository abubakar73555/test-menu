// ==========================================
// لوحة تحكم الماستر
// ==========================================
import { logActivity, safeUrl } from './utils.js';
import { getFilteredRestaurants } from './db.js';

export async function handleMasterRoute(request, env) {
  const cookie = request.headers.get("Cookie") || "";
  if (!cookie.includes("auth_role=master")) 
    return Response.redirect(new URL("/", request.url));

  const url = new URL(request.url);
  const searchParams = url.searchParams;

  if (request.method === "POST") {
    const data = await request.formData();
    const action = data.get("action");

    if (action === "add") {
      const slug = safeUrl(data.get("slug"));
      const existing = await env.DB.prepare("SELECT id FROM restaurants WHERE slug = ?").bind(slug).first();
      if (existing) {
        const { restaurants, ...stats } = await getFilteredRestaurants(env, url);
        return new Response(renderMasterHTML(restaurants, stats, searchParams, "❌ Slug موجود مسبقاً"), { 
          headers: { "Content-Type": "text/html; charset=utf-8" } 
        });
      }
      await env.DB.prepare(
        "INSERT INTO restaurants (res_name, slug, admin_password, created_at, expires_at) VALUES (?, ?, ?, ?, ?)"
      ).bind(data.get("res_name"), slug, data.get("pass"), data.get("created"), data.get("expires")).run();
      
      const newRes = await env.DB.prepare("SELECT id FROM restaurants WHERE slug = ?").bind(slug).first();
      await env.DB.prepare(
        "INSERT INTO restaurant_settings (restaurant_id, theme_name) VALUES (?, ?)"
      ).bind(newRes.id, 'default').run();

      await logActivity(env, null, "master_add_restaurant", `أضاف مطعم ${data.get("res_name")}`);

    } else if (action === "edit") {
      const id = data.get("id");
      await env.DB.prepare(
        "UPDATE restaurants SET res_name = ?, slug = ?, admin_password = ?, expires_at = ? WHERE id = ?"
      ).bind(data.get("res_name"), data.get("slug"), data.get("pass"), data.get("expires"), id).run();
      await logActivity(env, id, "master_edit_restaurant", `عدل بيانات المطعم ${data.get("res_name")}`);

    } else if (action === "delete") {
      const id = data.get("id");
      await env.DB.prepare("DELETE FROM restaurants WHERE id = ?").bind(id).run();
      await logActivity(env, null, "master_delete_restaurant", `حذف مطعم ID: ${id}`);
    }

    return Response.redirect(new URL("/admin/master", request.url));
  }

  const { restaurants, ...stats } = await getFilteredRestaurants(env, url);
  return new Response(renderMasterHTML(restaurants, stats, searchParams), { 
    headers: { "Content-Type": "text/html; charset=utf-8" } 
  });
}

function renderMasterHTML(restaurants, stats, searchParams, errorMsg = "") {
  const today = new Date().toISOString().split('T')[0];
  const expiredCount = restaurants.filter(r => r.expires_at < today).length;
  const nearExpiryCount = restaurants.filter(r => 
    !(r.expires_at < today) && (new Date(r.expires_at) - new Date(today)) / (1000*60*60*24) <= 3
  ).length;

  const rows = restaurants.map(r => {
    const isExpired = r.expires_at < today;
    const isNear = !isExpired && (new Date(r.expires_at) - new Date(today)) / (1000*60*60*24) <= 3;
    const rowStyle = isExpired ? 'background:#ffdddd;' : (isNear ? 'background:#fff3cd;' : '');

    return `<tr style="${rowStyle}">
      <td style="padding:10px; border-bottom:1px solid #eee;">${r.res_name}</td>
      <td style="padding:10px; border-bottom:1px solid #eee;">${r.expires_at}</td>
      <td style="padding:10px; border-bottom:1px solid #eee;">${r.last_activity || ''}</td>
      <td style="padding:10px; border-bottom:1px solid #eee;">
        <div style="display:flex; flex-wrap:wrap; gap:5px; justify-content:center;">
          <a href="/admin/${r.slug}" style="background:#007bff; color:white; padding:4px 8px; border-radius:3px; text-decoration:none; font-size:0.9rem;">إدارة</a>
          <a href="/admin/${r.slug}/categories" style="background:#28a745; color:white; padding:4px 8px; border-radius:3px; text-decoration:none; font-size:0.9rem;">الفئات</a>
          <a href="/admin/${r.slug}/settings" style="background:#17a2b8; color:white; padding:4px 8px; border-radius:3px; text-decoration:none; font-size:0.9rem;">تخصيص</a>
          <button onclick="openEditModal(${r.id}, '${r.res_name.replace(/'/g, "\\'")}', '${r.slug}', '${r.admin_password}', '${r.expires_at}')" 
            style="background:orange; color:white; border:none; padding:4px 8px; border-radius:3px; cursor:pointer; font-size:0.9rem;">تعديل</button>
          <form method="POST" style="display:inline;" onsubmit="return confirm('هل أنت متأكد من الحذف؟');">
            <input type="hidden" name="action" value="delete">
            <input type="hidden" name="id" value="${r.id}">
            <button style="background:red; color:white; border:none; padding:4px 8px; border-radius:3px; cursor:pointer; font-size:0.9rem;">حذف</button>
          </form>
        </div>
      </td>
    </tr>`;
  }).join('');

  const searchParam = searchParams?.get("search") || "";
  const statusParam = searchParams?.get("status") || "all";

  return `<!DOCTYPE html>
<html dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>لوحة الماستر</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Tahoma, Arial, sans-serif; background: #f4f7f6; padding: 15px; }
    .container { max-width: 1200px; margin: auto; }
    h1 { font-size: 1.8rem; margin-bottom: 20px; color: #333; text-align: center; }
    .stats { display: flex; gap: 15px; margin-bottom: 20px; flex-wrap: wrap; }
    .stat-card { background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); flex: 1 1 180px; text-align: center; min-width: 140px; }
    .stat-card h3 { margin: 0 0 10px; color: #555; font-size: 1rem; }
    .stat-card .number { font-size: 2rem; font-weight: bold; color: #007bff; }
    .card { background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); margin-bottom: 20px; }
    .filters { display: flex; gap: 10px; margin-bottom: 20px; flex-wrap: wrap; }
    .filters input, .filters select, .filters button { padding: 10px; border: 1px solid #ddd; border-radius: 5px; font-size: 1rem; }
    .filters input { flex: 2; min-width: 200px; }
    .filters select { flex: 1; min-width: 120px; }
    table { width: 100%; border-collapse: collapse; text-align: right; }
    th { background: #f0f0f0; padding: 12px; font-size: 0.95rem; }
    td { padding: 12px; border-bottom: 1px solid #eee; }
    .modal { display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); justify-content: center; align-items: center; z-index: 1000; }
    .modal-content { background: white; padding: 25px; border-radius: 10px; width: 90%; max-width: 450px; max-height: 90vh; overflow-y: auto; }
    .modal-content h3 { margin-bottom: 20px; }
    .modal-content input { width: 100%; padding: 10px; margin: 8px 0; border: 1px solid #ddd; border-radius: 5px; }
    .modal-content button { padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; }
    .error { color: red; margin-bottom: 10px; }
    .alert { padding: 12px; border-radius: 5px; margin-bottom: 20px; }
    .alert-danger { background: #f8d7da; color: #721c24; }
    .alert-warning { background: #fff3cd; color: #856404; }
    @media (max-width: 768px) {
      body { padding: 10px; }
      h1 { font-size: 1.5rem; }
      .stats .stat-card { flex: 1 1 calc(50% - 10px); }
      table, thead, tbody, th, td, tr { display: block; }
      thead tr { position: absolute; top: -9999px; left: -9999px; }
      tr { margin-bottom: 15px; border: 1px solid #ddd; border-radius: 8px; overflow: hidden; }
      td { display: flex; justify-content: space-between; align-items: center; padding: 10px; text-align: right; border-bottom: 1px solid #eee; }
      td:last-child { border-bottom: none; }
      td:before { content: attr(data-label); font-weight: bold; margin-left: 10px; color: #555; width: 40%; }
    }
    @media (max-width: 480px) {
      .stats .stat-card { flex: 1 1 100%; }
      .filters input, .filters select, .filters button { width: 100%; }
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>👑 لوحة تحكم الماستر</h1>
    ${errorMsg ? `<div class="error">${errorMsg}</div>` : ''}

    <div class="stats">
      <div class="stat-card"><h3>إجمالي المطاعم</h3><div class="number">${stats.totalCount}</div></div>
      <div class="stat-card"><h3>المطاعم النشطة</h3><div class="number">${stats.activeCount}</div></div>
      <div class="stat-card"><h3>المطاعم المنتهية</h3><div class="number">${stats.expiredCount}</div></div>
      <div class="stat-card"><h3>إجمالي الوجبات</h3><div class="number">${stats.totalItems}</div></div>
    </div>

    ${expiredCount > 0 ? `<div class="alert alert-danger">⚠️ هناك ${expiredCount} مطعم منتهي الاشتراك.</div>` : ''}
    ${nearExpiryCount > 0 ? `<div class="alert alert-warning">⏰ هناك ${nearExpiryCount} مطعم على وشك الانتهاء (أقل من 3 أيام).</div>` : ''}

    <div class="card">
      <h3>➕ إضافة مطعم جديد</h3>
      <form method="POST" style="display:grid; grid-template-columns:repeat(auto-fit, minmax(150px,1fr)); gap:10px;">
        <input type="hidden" name="action" value="add">
        <input type="text" name="res_name" placeholder="اسم المطعم" required>
        <input type="text" name="slug" placeholder="الرابط (slug)" required>
        <input type="text" name="pass" placeholder="كلمة المرور" required>
        <input type="date" name="created" value="${new Date().toISOString().split('T')[0]}" required>
        <input type="date" name="expires" required>
        <button type="submit" style="background:#28a745; color:white; border:none; padding:10px; border-radius:5px; cursor:pointer;">إضافة</button>
      </form>
    </div>

    <div class="filters">
      <form method="GET" style="display:flex; gap:10px; width:100%; flex-wrap:wrap;">
        <input type="text" name="search" placeholder="بحث باسم المطعم أو slug" value="${searchParam}">
        <select name="status">
          <option value="all" ${statusParam==='all'? 'selected':''}>جميع المطاعم</option>
          <option value="active" ${statusParam==='active'? 'selected':''}>النشطة فقط</option>
          <option value="expired" ${statusParam==='expired'? 'selected':''}>المنتهية فقط</option>
        </select>
        <button type="submit" style="background:#007bff; color:white; border:none; padding:10px 20px; border-radius:5px;">تطبيق</button>
      </form>
    </div>

    <div class="card">
      <table>
        <thead>
          <tr><th>اسم المطعم</th><th>تاريخ الانتهاء</th><th>آخر نشاط</th><th>الإجراءات</th></tr>
        </thead>
        <tbody>
          ${rows || '<tr><td colspan="4" style="text-align:center;">لا توجد مطاعم</td></tr>'}
        </tbody>
      </table>
    </div>

    <div id="editModal" class="modal" onclick="if(event.target===this) this.style.display='none'">
      <div class="modal-content">
        <h3>✏️ تعديل المطعم</h3>
        <form method="POST" id="editForm">
          <input type="hidden" name="action" value="edit">
          <input type="hidden" name="id" id="editId">
          <div><label>اسم المطعم:</label><br><input type="text" name="res_name" id="editResName" required></div>
          <div><label>الرابط (slug):</label><br><input type="text" name="slug" id="editSlug" required></div>
          <div><label>كلمة المرور:</label><br><input type="text" name="pass" id="editPass" required></div>
          <div><label>تاريخ الانتهاء:</label><br><input type="date" name="expires" id="editExpires" required></div>
          <div style="display:flex; gap:10px; justify-content:flex-end; margin-top:15px;">
            <button type="button" onclick="document.getElementById('editModal').style.display='none'" style="background:#6c757d; color:white;">إلغاء</button>
            <button type="submit" style="background:#007bff; color:white;">حفظ التعديلات</button>
          </div>
        </form>
      </div>
    </div>

    <script>
      function openEditModal(id, name, slug, pass, expires) {
        document.getElementById('editId').value = id;
        document.getElementById('editResName').value = name;
        document.getElementById('editSlug').value = slug;
        document.getElementById('editPass').value = pass;
        document.getElementById('editExpires').value = expires;
        document.getElementById('editModal').style.display = 'flex';
      }
    </script>
  </div>
</body>
</html>`;
}