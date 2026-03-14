// ==========================================
// 1. الإعدادات العامة
// ==========================================
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const pathname = url.pathname;
    const parts = pathname.split('/').filter(Boolean);

    try {
      if (pathname === "/" || pathname === "") return handleLoginRoute(request, env);
      if (parts[0] === "admin" && parts[1] === "master") return handleMasterRoute(request, env);
      
      if (parts[0] === "admin" && parts[1] && parts[2] === "categories") 
        return handleCategoriesRoute(request, env, parts[1]);
      if (parts[0] === "admin" && parts[1] && parts[2] === "settings") 
        return handleSettingsRoute(request, env, parts[1]);
      
      if (parts[0] === "admin" && parts[1]) 
        return handleRestaurantRoute(request, env, parts[1], url.origin);
      
      if (parts[0] === "about" && parts[1]) 
        return handleAboutRoute(env, parts[1]);
      
      if (parts[0] === "menu" && parts[1]) 
        return handlePublicMenuRoute(env, parts[1], url);
      
      if (parts[0] === "upload" && parts[1] === "image") 
        return handleImageUpload(request, env);

      return new Response("404 Not Found", { status: 404 });
    } catch (e) {
      return new Response(JSON.stringify({ error: e.message, stack: e.stack }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }
  }
};

// ==========================================
// 2. دوال مساعدة عامة
// ==========================================
async function logActivity(env, restaurantId, action, details) {
  await env.DB.prepare(
    "INSERT INTO activity_logs (restaurant_id, action, timestamp) VALUES (?, ?, ?)"
  ).bind(restaurantId, `${action}: ${details}`, new Date().toISOString()).run();
}

async function getFilteredRestaurants(env, url) {
  const search = url.searchParams.get("search") || "";
  const status = url.searchParams.get("status") || "all";
  const today = new Date().toISOString().split('T')[0];

  let query = "SELECT * FROM restaurants WHERE 1=1";
  const params = [];

  if (search) {
    query += " AND (res_name LIKE ? OR slug LIKE ?)";
    params.push(`%${search}%`, `%${search}%`);
  }
  if (status === "active") {
    query += " AND expires_at >= ?";
    params.push(today);
  } else if (status === "expired") {
    query += " AND expires_at < ?";
    params.push(today);
  }
  query += " ORDER BY created_at DESC";

  const { results: restaurants } = await env.DB.prepare(query).bind(...params).all();

  const totalCount = (await env.DB.prepare("SELECT COUNT(*) as count FROM restaurants").first()).count;
  const activeCount = (await env.DB.prepare("SELECT COUNT(*) as count FROM restaurants WHERE expires_at >= ?").bind(today).first()).count;
  const expiredCount = totalCount - activeCount;
  const totalItems = (await env.DB.prepare("SELECT COUNT(*) as count FROM items").first()).count;

  for (let res of restaurants) {
    const lastLog = await env.DB.prepare(
      "SELECT action, timestamp FROM activity_logs WHERE restaurant_id = ? ORDER BY timestamp DESC LIMIT 1"
    ).bind(res.id).first();
    res.last_activity = lastLog 
      ? `${lastLog.action} في ${new Date(lastLog.timestamp).toLocaleString('ar-EG')}` 
      : "لا يوجد نشاط";
  }

  return { restaurants, totalCount, activeCount, expiredCount, totalItems };
}

// ==========================================
// 3. رفع الصور إلى R2
// ==========================================
async function handleImageUpload(request, env) {
  if (!env.R2) {
    return new Response(JSON.stringify({ error: "❌ خطأ في الإعدادات: لم يتم ربط مخزن الصور (R2) مع التطبيق." }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }

  const cookie = request.headers.get("Cookie") || "";
  const isMaster = cookie.includes("auth_role=master");
  let restaurantSlug = null;
  const match = cookie.match(/auth_role=res_([^;]+)/);
  if (match) restaurantSlug = match[1];

  if (!isMaster && !restaurantSlug) {
    return new Response(JSON.stringify({ error: "❌ غير مصرح: يجب تسجيل الدخول أولاً." }), {
      status: 401,
      headers: { "Content-Type": "application/json" }
    });
  }

  let formData;
  try {
    formData = await request.formData();
  } catch (e) {
    return new Response(JSON.stringify({ error: "❌ فشل قراءة بيانات النموذج: " + e.message }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }

  let restaurantId;
  try {
    if (isMaster) {
      restaurantId = formData.get("restaurant_id");
    } else {
      const res = await env.DB.prepare("SELECT id FROM restaurants WHERE slug = ?").bind(restaurantSlug).first();
      if (!res) return new Response(JSON.stringify({ error: "❌ المطعم غير موجود." }), { status: 404, headers: { "Content-Type": "application/json" } });
      restaurantId = res.id;
    }
  } catch (dbError) {
    return new Response(JSON.stringify({ error: "❌ خطأ في قاعدة البيانات: " + dbError.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }

  const file = formData.get("image");
  if (!file) {
    return new Response(JSON.stringify({ error: "❌ لم يتم اختيار أي صورة." }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }

  if (!file.type.startsWith("image/")) {
    return new Response(JSON.stringify({ error: "❌ نوع الملف غير مدعوم." }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }

  const MAX_SIZE = 5 * 1024 * 1024;
  if (file.size > MAX_SIZE) {
    return new Response(JSON.stringify({ error: "❌ حجم الصورة كبير جداً. الحد الأقصى 5 ميجابايت." }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }

  let bytes, buffer;
  try {
    bytes = await file.arrayBuffer();
    buffer = new Uint8Array(bytes);
  } catch (e) {
    return new Response(JSON.stringify({ error: "❌ فشل قراءة محتوى الصورة: " + e.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }

  const safeFileName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
  const fileName = `${restaurantId}/${Date.now()}-${safeFileName}`;

  try {
    await env.R2.put(fileName, buffer, {
      httpMetadata: { contentType: file.type }
    });
  } catch (r2Error) {
    return new Response(JSON.stringify({ error: "❌ فشل رفع الصورة: " + r2Error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }

  const publicUrl = `https://images.topsafetypro.com/${fileName}`;
  return new Response(JSON.stringify({ url: publicUrl, message: "✅ تم رفع الصورة بنجاح" }), {
    headers: { "Content-Type": "application/json" }
  });
}

// ==========================================
// 4. صفحة تسجيل الدخول
// ==========================================
async function handleLoginRoute(request, env) {
  const MASTER_PASSWORD = env.MASTER_PASSWORD || "admin123";

  if (request.method === "POST") {
    const data = await request.formData();
    const user = data.get("user").toLowerCase().trim();
    const pass = data.get("pass").trim();

    if (user === "master" && pass === MASTER_PASSWORD) {
      return new Response(null, { 
        status: 302, 
        headers: { 
          "Location": "/admin/master", 
          "Set-Cookie": "auth_role=master; Path=/; HttpOnly" 
        } 
      });
    }

    const res = await env.DB.prepare("SELECT * FROM restaurants WHERE slug = ?").bind(user).first();
    if (res && res.admin_password === pass) {
      await logActivity(env, res.id, "restaurant_login", `دخول إلى لوحة التحكم`);
      return new Response(null, { 
        status: 302, 
        headers: { 
          "Location": `/admin/${user}`, 
          "Set-Cookie": `auth_role=res_${user}; Path=/; HttpOnly` 
        } 
      });
    }

    return new Response(renderLoginHTML("❌ بيانات خاطئة"), { 
      headers: { "Content-Type": "text/html; charset=utf-8" } 
    });
  }
  return new Response(renderLoginHTML(), { 
    headers: { "Content-Type": "text/html; charset=utf-8" } 
  });
}

function renderLoginHTML(err = "") {
  return `<!DOCTYPE html>
<html dir="rtl">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>تسجيل الدخول</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Tahoma, Arial, sans-serif; background: #f4f7f6; display: flex; justify-content: center; align-items: center; min-height: 100vh; padding: 20px; }
  .card { background: white; padding: 30px 25px; border-radius: 15px; box-shadow: 0 5px 15px rgba(0,0,0,0.1); width: 100%; max-width: 350px; text-align: center; }
  h2 { margin-bottom: 20px; color: #333; }
  input, button { width: 100%; margin: 10px 0; padding: 12px; border: 1px solid #ddd; border-radius: 8px; font-size: 16px; }
  button { background: #007bff; color: white; border: none; cursor: pointer; font-weight: bold; }
  .error { color: red; margin-bottom: 15px; }
</style>
</head>
<body>
  <div class="card">
    <h2>🔐 تسجيل الدخول</h2>
    <p class="error">${err}</p>
    <form method="POST">
      <input name="user" placeholder="اليوزر أو السلج" required>
      <input type="password" name="pass" placeholder="كلمة المرور" required>
      <button type="submit">دخول</button>
    </form>
  </div>
</body>
</html>`;
}

// ==========================================
// 5. لوحة تحكم الماستر (مُحسّنة ومضمونة العمل)
// ==========================================
async function handleMasterRoute(request, env) {
  const cookie = request.headers.get("Cookie") || "";
  if (!cookie.includes("auth_role=master")) 
    return Response.redirect(new URL("/", request.url));

  const url = new URL(request.url);
  const searchParams = url.searchParams;

  if (request.method === "POST") {
    const data = await request.formData();
    const action = data.get("action");

    if (action === "add") {
      const slug = data.get("slug").toLowerCase().trim().replace(/\s+/g, '-');
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

// ==========================================
// 6. إدارة الفئات (مُحسّنة للجوال)
// ==========================================
async function handleCategoriesRoute(request, env, slug) {
  const cookie = request.headers.get("Cookie") || "";
  const isMaster = cookie.includes("auth_role=master");
  const isOwner = cookie.includes(`auth_role=res_${slug}`);
  if (!isMaster && !isOwner) return Response.redirect(new URL("/", request.url));

  const res = await env.DB.prepare("SELECT * FROM restaurants WHERE slug = ?").bind(slug).first();
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
// 7. لوحة تحكم المطعم (مع مميز وعدد طاولات ديناميكي)
// ==========================================
async function handleRestaurantRoute(request, env, slug, origin) {
  const cookie = request.headers.get("Cookie") || "";
  const isMaster = cookie.includes("auth_role=master");
  const isOwner = cookie.includes(`auth_role=res_${slug}`);
  if (!isMaster && !isOwner) return Response.redirect(new URL("/", request.url));

  const res = await env.DB.prepare("SELECT * FROM restaurants WHERE slug = ?").bind(slug).first();
  if (!res) return new Response("المطعم غير موجود", { status: 404 });

  const { results: categories } = await env.DB.prepare(
    "SELECT * FROM categories WHERE restaurant_id = ? ORDER BY sort_order, name"
  ).bind(res.id).all();

  // جلب معلومات المطعم لمعرفة عدد الطاولات
  const info = await env.DB.prepare("SELECT * FROM restaurant_info WHERE restaurant_id = ?").bind(res.id).first() || { number_of_tables: 5 };

  if (request.method === "POST") {
    const data = await request.formData();
    const action = data.get("action");

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

    return Response.redirect(new URL(`/admin/${slug}`, request.url));
  }

  const { results: items } = await env.DB.prepare(`
    SELECT items.*, categories.name as category_name 
    FROM items 
    LEFT JOIN categories ON items.category_id = categories.id 
    WHERE items.restaurant_id = ?
    ORDER BY items.featured DESC, categories.sort_order, categories.name, items.name
  `).bind(res.id).all();

  const settings = await env.DB.prepare(
    "SELECT * FROM restaurant_settings WHERE restaurant_id = ?"
  ).bind(res.id).first() || { theme_name: 'default', primary_color: '#007bff', secondary_color: '#6c757d', font_family: 'Tahoma', logo_url: '' };

  return new Response(renderRestaurantHTML(res, items, categories, settings, origin, info), {
    headers: { "Content-Type": "text/html; charset=utf-8" }
  });
}

function renderRestaurantHTML(res, items, categories, settings, origin, info) {
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
        <button onclick="openEditItemModal(${i.id}, '${i.name.replace(/'/g, "\\'")}', ${i.price}, ${i.category_id || 'null'}, '${i.image_url || ''}', ${i.featured})" style="background:orange; color:white; border:none; padding:5px 10px; border-radius:3px;">تعديل</button>
        <form method="POST" style="margin:0;" onsubmit="return confirm('حذف الوجبة؟');">
          <input type="hidden" name="action" value="delete">
          <input type="hidden" name="id" value="${i.id}">
          <button style="background:red; color:white; border:none; padding:5px 10px; border-radius:3px;">حذف</button>
        </form>
      </div>
    </li>
  `).join('');

  // توليد روابط الطاولات بناءً على العدد المخزن في info.number_of_tables
  const tableLinks = Array.from({ length: info.number_of_tables || 5 }, (_, i) => i + 1)
    .map(n => `<a href="/menu/${res.slug}?table=${n}" target="_blank" style="background: ${settings.primary_color}; color: white; padding: 8px 15px; border-radius: 5px; text-decoration: none; margin: 5px; display: inline-block;">طاولة ${n}</a>`)
    .join('');

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

    <!-- روابط الطاولات ديناميكية -->
    <div class="qr-tables">
      <h3>🪑 روابط QR للطاولات</h3>
      <p>استخدم هذه الروابط لإنشاء QR code لكل طاولة (${info.number_of_tables || 5} طاولة):</p>
      <div style="display: flex; flex-wrap: wrap; gap: 10px; justify-content: center;">
        ${tableLinks}
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
  </script>
</body>
</html>`;
}

// ==========================================
// 8. إعدادات تخصيص المنيو (مع عدد الطاولات)
// ==========================================
async function handleSettingsRoute(request, env, slug) {
  const cookie = request.headers.get("Cookie") || "";
  const isMaster = cookie.includes("auth_role=master");
  const isOwner = cookie.includes(`auth_role=res_${slug}`);
  if (!isMaster && !isOwner) return Response.redirect(new URL("/", request.url));

  const res = await env.DB.prepare("SELECT * FROM restaurants WHERE slug = ?").bind(slug).first();
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

  const settings = await env.DB.prepare("SELECT * FROM restaurant_settings WHERE restaurant_id = ?").bind(res.id).first() || {
    theme_name: 'default', primary_color: '#007bff', secondary_color: '#6c757d', font_family: 'Tahoma', logo_url: ''
  };

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
// 9. صفحة المنيو العامة (مع سلة طلبات وواتساب)
// ==========================================
async function handlePublicMenuRoute(env, slug, url) {
  const res = await env.DB.prepare("SELECT * FROM restaurants WHERE slug = ?").bind(slug).first();
  if (!res) return new Response("المطعم غير موجود", { status: 404 });

  const info = await env.DB.prepare("SELECT * FROM restaurant_info WHERE restaurant_id = ?").bind(res.id).first() || { number_of_tables: 5, whatsapp: '' };
  const settings = await env.DB.prepare("SELECT * FROM restaurant_settings WHERE restaurant_id = ?").bind(res.id).first() || {
    theme_name: 'default', primary_color: '#007bff', secondary_color: '#6c757d', font_family: 'Tahoma', logo_url: ''
  };

  const table = url.searchParams.get("table") || null;

  const { results: categories } = await env.DB.prepare(`
    SELECT c.*, 
           (SELECT json_group_array(json_object('id', i.id, 'name', i.name, 'price', i.price, 'image_url', i.image_url, 'featured', i.featured))
            FROM items i WHERE i.category_id = c.id ORDER BY i.featured DESC, i.name) as items_json
    FROM categories c
    WHERE c.restaurant_id = ?
    ORDER BY c.sort_order, c.name
  `).bind(res.id).all();

  const { results: uncategorized } = await env.DB.prepare(`
    SELECT * FROM items WHERE restaurant_id = ? AND category_id IS NULL ORDER BY featured DESC, name
  `).bind(res.id).all();

  return new Response(renderPublicMenuHTML(res, categories, uncategorized, settings, table, info), {
    headers: { "Content-Type": "text/html; charset=utf-8" }
  });
}

function renderPublicMenuHTML(res, categories, uncategorized, settings, table, info) {
  const themeStyles = `
    :root {
      --primary: ${settings.primary_color};
      --secondary: ${settings.secondary_color};
      --font: ${settings.font_family};
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: var(--font), Tahoma, Arial;
      background: #fafafa;
      margin: 0;
      padding: 15px;
      padding-bottom: 80px; /* مساحة للسلة */
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
    }
    .logo {
      max-height: 80px;
      max-width: 100%;
      object-fit: contain;
    }
    .table-message {
      background: var(--primary);
      color: white;
      padding: 10px;
      border-radius: 8px;
      margin-bottom: 15px;
      text-align: center;
    }
    .search-box {
      width: 100%;
      padding: 12px;
      margin-bottom: 20px;
      border: 1px solid #ddd;
      border-radius: 8px;
      font-size: 1rem;
    }
    .category {
      margin-bottom: 40px;
    }
    .category h2 {
      color: var(--primary);
      border-bottom: 2px solid var(--primary);
      padding-bottom: 5px;
      margin-bottom: 15px;
    }
    .items-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 15px;
      justify-content: center;
    }
    .item-card {
      background: white;
      border: 1px solid #ddd;
      border-radius: 10px;
      width: calc(50% - 10px);
      max-width: 200px;
      padding: 10px;
      text-align: center;
      box-shadow: 0 2px 5px rgba(0,0,0,0.1);
      transition: transform 0.2s;
      position: relative;
    }
    .item-card.featured {
      border: 2px solid gold;
      background: #fff9e6;
    }
    .featured-badge {
      position: absolute;
      top: -10px;
      left: -10px;
      background: gold;
      color: #333;
      border-radius: 50%;
      width: 30px;
      height: 30px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
    }
    .item-card:hover {
      transform: scale(1.02);
    }
    .item-card img {
      width: 100%;
      height: 150px;
      object-fit: cover;
      border-radius: 8px;
    }
    .item-card h3 {
      margin: 10px 0 5px;
      font-size: 1.1rem;
    }
    .item-card .price {
      color: green;
      font-weight: bold;
    }
    .add-to-cart-btn {
      background: var(--primary);
      color: white;
      border: none;
      padding: 8px;
      border-radius: 5px;
      width: 100%;
      margin-top: 5px;
      cursor: pointer;
    }
    #cart-container {
      position: fixed;
      bottom: 10px;
      left: 10px;
      background: white;
      border: 2px solid var(--primary);
      border-radius: 10px;
      padding: 15px;
      max-width: 300px;
      max-height: 400px;
      overflow-y: auto;
      box-shadow: 0 5px 15px rgba(0,0,0,0.2);
      z-index: 1000;
      display: none;
    }
    #toggle-cart {
      position: fixed;
      bottom: 10px;
      left: 10px;
      background: var(--primary);
      color: white;
      border: none;
      border-radius: 50px;
      padding: 10px 20px;
      cursor: pointer;
      z-index: 1001;
      font-size: 1rem;
    }
    .cart-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 5px 0;
      border-bottom: 1px solid #eee;
    }
    .cart-item span {
      margin: 0 5px;
    }
    .cart-total {
      font-weight: bold;
      padding-top: 10px;
    }
    .send-wa-btn {
      background: #25D366;
      color: white;
      border: none;
      padding: 10px;
      border-radius: 5px;
      width: 100%;
      margin-top: 10px;
      cursor: pointer;
    }
    .clear-cart-btn {
      background: #dc3545;
      color: white;
      border: none;
      padding: 5px;
      border-radius: 5px;
      width: 100%;
      margin-top: 5px;
      cursor: pointer;
    }
    .about-link {
      display: inline-block;
      margin-top: 10px;
      padding: 5px 15px;
      border: 1px solid var(--primary);
      border-radius: 20px;
      color: var(--primary);
      text-decoration: none;
    }
    @media (max-width: 480px) {
      .item-card {
        width: 100%;
        max-width: 100%;
      }
    }
  `;

  const tableMessage = table ? `<div class="table-message">أنت تتصفح قائمة طاولة رقم ${table}</div>` : '';

  let categoriesHtml = '';
  for (let cat of categories) {
    let items = [];
    try {
      items = JSON.parse(cat.items_json) || [];
    } catch { items = []; }
    const itemsHtml = items.map(item => `
      <div class="item-card ${item.featured ? 'featured' : ''}">
        ${item.featured ? '<div class="featured-badge">⭐</div>' : ''}
        ${item.image_url ? `<img src="${item.image_url}" alt="${item.name}">` : ''}
        <h3>${item.name}</h3>
        <p class="price">${item.price} ريال</p>
        <button class="add-to-cart-btn" data-id="${item.id}" data-name="${item.name}" data-price="${item.price}">➕ أضف إلى السلة</button>
      </div>
    `).join('');
    categoriesHtml += `
      <div class="category">
        <h2>${cat.name}</h2>
        <div class="items-grid">${itemsHtml || '<p>لا توجد وجبات</p>'}</div>
      </div>
    `;
  }

  if (uncategorized.length > 0) {
    const itemsHtml = uncategorized.map(item => `
      <div class="item-card ${item.featured ? 'featured' : ''}">
        ${item.featured ? '<div class="featured-badge">⭐</div>' : ''}
        ${item.image_url ? `<img src="${item.image_url}" alt="${item.name}">` : ''}
        <h3>${item.name}</h3>
        <p class="price">${item.price} ريال</p>
        <button class="add-to-cart-btn" data-id="${item.id}" data-name="${item.name}" data-price="${item.price}">➕ أضف إلى السلة</button>
      </div>
    `).join('');
    categoriesHtml += `
      <div class="category">
        <h2>أخرى</h2>
        <div class="items-grid">${itemsHtml}</div>
      </div>
    `;
  }

  return `<!DOCTYPE html>
<html dir="rtl">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${res.res_name}</title>
<style>${themeStyles}</style>
</head>
<body>
  <div class="header">
    ${settings.logo_url ? `<img src="${settings.logo_url}" class="logo">` : ''}
    <h1 style="color:var(--primary);">${res.res_name}</h1>
    ${tableMessage}
    <a href="/about/${res.slug}" class="about-link">ℹ️ عن المطعم</a>
  </div>

  <input type="text" id="searchInput" class="search-box" placeholder="🔍 ابحث عن وجبة...">

  <div id="menuContainer">
    ${categoriesHtml || '<p style="text-align:center;">قائمة الطعام قريباً...</p>'}
  </div>

  <!-- عناصر السلة -->
  <div id="cart-container"></div>
  <button id="toggle-cart">🛒 عرض السلة</button>

  <script>
    let cart = JSON.parse(localStorage.getItem('cart')) || [];

    function saveCart() {
      localStorage.setItem('cart', JSON.stringify(cart));
      updateCartDisplay();
    }

    function addToCart(id, name, price) {
      const existing = cart.find(item => item.id === id);
      if (existing) {
        existing.quantity += 1;
      } else {
        cart.push({ id, name, price, quantity: 1 });
      }
      saveCart();
    }

    function removeFromCart(id) {
      cart = cart.filter(item => item.id !== id);
      saveCart();
    }

    function updateQuantity(id, delta) {
      const item = cart.find(item => item.id === id);
      if (item) {
        item.quantity += delta;
        if (item.quantity <= 0) {
          removeFromCart(id);
        } else {
          saveCart();
        }
      }
    }

    function updateCartDisplay() {
      const cartDiv = document.getElementById('cart-container');
      if (cart.length === 0) {
        cartDiv.style.display = 'none';
        return;
      }
      cartDiv.style.display = 'block';
      let total = 0;
      let html = '<h3 style="margin-bottom:10px;">🛒 سلة الطلبات</h3><ul style="list-style:none; padding:0;">';
      cart.forEach(item => {
        total += item.price * item.quantity;
        html += \`
          <li class="cart-item">
            <span>\${item.name} x\${item.quantity}</span>
            <span>\${item.price * item.quantity} ريال</span>
            <span>
              <button onclick="updateQuantity(\${item.id}, -1)">-</button>
              <button onclick="updateQuantity(\${item.id}, 1)">+</button>
              <button onclick="removeFromCart(\${item.id})">🗑️</button>
            </span>
          </li>
        \`;
      });
      html += \`<li class="cart-total">المجموع: \${total} ريال</li>\`;
      html += '</ul>';
      html += \`<button class="send-wa-btn" onclick="sendOrder()">📱 إرسال الطلب عبر واتساب</button>\`;
      html += \`<button class="clear-cart-btn" onclick="clearCart()">تفريغ السلة</button>\`;
      cartDiv.innerHTML = html;
    }

    function clearCart() {
      cart = [];
      saveCart();
    }

    function sendOrder() {
      if (cart.length === 0) return alert('السلة فارغة');
      const phone = "${info.whatsapp || ''}".replace(/\\D/g, '');
      if (!phone) return alert('رقم واتساب المطعم غير مضبوط');

      let orderText = 'طلب جديد من المنيو';
      if ("${table}") orderText += ' (طاولة رقم ${table})';
      orderText += ':\\n';
      let total = 0;
      cart.forEach(item => {
        orderText += \`\${item.name} x\${item.quantity} = \${item.price * item.quantity} ريال\\n\`;
        total += item.price * item.quantity;
      });
      orderText += \`\\nالإجمالي: \${total} ريال\`;
      window.open(\`https://wa.me/\${phone}?text=\${encodeURIComponent(orderText)}\`, '_blank');
    }

    // إضافة المستمعين لأزرار الإضافة
    document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = btn.dataset.id;
        const name = btn.dataset.name;
        const price = parseFloat(btn.dataset.price);
        addToCart(id, name, price);
      });
    });

    // زر إظهار/إخفاء السلة
    document.getElementById('toggle-cart').addEventListener('click', () => {
      const cartDiv = document.getElementById('cart-container');
      cartDiv.style.display = cartDiv.style.display === 'none' ? 'block' : 'none';
    });

    // تحديث عرض السلة عند التحميل
    updateCartDisplay();

    // وظيفة البحث
    document.getElementById('searchInput').addEventListener('input', function(e) {
      const term = e.target.value.toLowerCase();
      document.querySelectorAll('.item-card').forEach(card => {
        const name = card.querySelector('h3').textContent.toLowerCase();
        card.style.display = name.includes(term) ? 'block' : 'none';
      });
      document.querySelectorAll('.category').forEach(cat => {
        const visibleItems = Array.from(cat.querySelectorAll('.item-card')).filter(card => card.style.display !== 'none');
        cat.style.display = visibleItems.length === 0 ? 'none' : 'block';
      });
    });
  </script>
</body>
</html>`;
}

// ==========================================
// 10. صفحة عن المطعم
// ==========================================
async function handleAboutRoute(env, slug) {
  const res = await env.DB.prepare("SELECT * FROM restaurants WHERE slug = ?").bind(slug).first();
  if (!res) return new Response("المطعم غير موجود", { status: 404 });

  let info = await env.DB.prepare("SELECT * FROM restaurant_info WHERE restaurant_id = ?").bind(res.id).first();
  if (!info) {
    info = { phone: '', whatsapp: '', address: '', map_url: '', working_hours: '', facebook: '', instagram: '' };
  }

  const settings = await env.DB.prepare("SELECT * FROM restaurant_settings WHERE restaurant_id = ?").bind(res.id).first() || {
    theme_name: 'default', primary_color: '#007bff', secondary_color: '#6c757d', font_family: 'Tahoma', logo_url: ''
  };

  return new Response(renderAboutHTML(res, info, settings), {
    headers: { "Content-Type": "text/html; charset=utf-8" }
  });
}

function renderAboutHTML(res, info, settings) {
  return `<!DOCTYPE html>
<html dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>عن ${res.res_name}</title>
  <style>
    :root {
      --primary: ${settings.primary_color};
      --secondary: ${settings.secondary_color};
      --font: ${settings.font_family};
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: var(--font), Tahoma, Arial;
      background: #fafafa;
      padding: 20px;
      direction: rtl;
    }
    .container {
      max-width: 800px;
      margin: auto;
      background: white;
      padding: 25px;
      border-radius: 15px;
      box-shadow: 0 5px 15px rgba(0,0,0,0.1);
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
    }
    .logo {
      max-height: 80px;
      max-width: 100%;
      object-fit: contain;
    }
    h1 {
      color: var(--primary);
      margin: 10px 0;
    }
    .info-card {
      background: #f9f9f9;
      padding: 20px;
      border-radius: 10px;
      margin-bottom: 25px;
    }
    .info-item {
      display: flex;
      align-items: center;
      gap: 15px;
      padding: 12px 0;
      border-bottom: 1px solid #eee;
    }
    .info-item:last-child {
      border-bottom: none;
    }
    .info-icon {
      font-size: 1.5rem;
      min-width: 40px;
      text-align: center;
    }
    .info-content {
      flex: 1;
    }
    .info-label {
      font-weight: bold;
      color: #555;
      font-size: 0.9rem;
    }
    .info-value {
      font-size: 1.1rem;
    }
    .map-container {
      margin: 25px 0;
      border-radius: 10px;
      overflow: hidden;
      box-shadow: 0 2px 5px rgba(0,0,0,0.1);
    }
    .map-container iframe {
      width: 100%;
      height: 300px;
      border: none;
    }
    .social-links {
      display: flex;
      justify-content: center;
      gap: 20px;
      margin-top: 20px;
    }
    .social-link {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 50px;
      height: 50px;
      border-radius: 50%;
      background: var(--primary);
      color: white;
      text-decoration: none;
      font-size: 1.5rem;
      transition: transform 0.2s;
    }
    .social-link:hover {
      transform: scale(1.1);
    }
    .back-link {
      display: block;
      text-align: center;
      margin-top: 25px;
      padding: 12px;
      background: var(--primary);
      color: white;
      text-decoration: none;
      border-radius: 8px;
      font-weight: bold;
    }
    .back-link:hover {
      opacity: 0.9;
    }
    @media (max-width: 600px) {
      .info-item {
        flex-direction: column;
        align-items: flex-start;
        gap: 5px;
      }
      .info-icon {
        margin-bottom: 5px;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      ${settings.logo_url ? `<img src="${settings.logo_url}" class="logo">` : ''}
      <h1>عن ${res.res_name}</h1>
    </div>

    <div class="info-card">
      ${info.phone ? `
      <div class="info-item">
        <div class="info-icon">📞</div>
        <div class="info-content">
          <div class="info-label">رقم الهاتف</div>
          <div class="info-value">${info.phone}</div>
        </div>
      </div>
      ` : ''}

      ${info.whatsapp ? `
      <div class="info-item">
        <div class="info-icon">💬</div>
        <div class="info-content">
          <div class="info-label">واتساب</div>
          <div class="info-value"><a href="https://wa.me/${info.whatsapp.replace(/\D/g,'')}" target="_blank">${info.whatsapp}</a></div>
        </div>
      </div>
      ` : ''}

      ${info.address ? `
      <div class="info-item">
        <div class="info-icon">📍</div>
        <div class="info-content">
          <div class="info-label">العنوان</div>
          <div class="info-value">${info.address}</div>
        </div>
      </div>
      ` : ''}

      ${info.working_hours ? `
      <div class="info-item">
        <div class="info-icon">⏰</div>
        <div class="info-content">
          <div class="info-label">ساعات العمل</div>
          <div class="info-value">${info.working_hours}</div>
        </div>
      </div>
      ` : ''}
    </div>

    ${info.map_url ? `
    <div class="map-container">
      <iframe src="${info.map_url}" allowfullscreen="" loading="lazy"></iframe>
    </div>
    ` : ''}

    <div class="social-links">
      ${info.facebook ? `<a href="${info.facebook}" class="social-link" target="_blank">📘</a>` : ''}
      ${info.instagram ? `<a href="${info.instagram}" class="social-link" target="_blank">📷</a>` : ''}
    </div>

    <a href="/menu/${res.slug}" class="back-link">🔙 العودة إلى القائمة</a>
  </div>
</body>
</html>`;
}
