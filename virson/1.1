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
      
      if (parts[0] === "menu" && parts[1]) 
        return handlePublicMenuRoute(env, parts[1]);
      
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
// 3. رفع الصور إلى R2 (مُحسّن مع تفاصيل الخطأ)
// ==========================================
async function handleImageUpload(request, env) {
  // التحقق من ربط R2
  if (!env.R2) {
    return new Response(JSON.stringify({ 
      error: "❌ خطأ في الإعدادات: لم يتم ربط مخزن الصور (R2) مع التطبيق. يرجى التواصل مع الدعم الفني." 
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }

  // التحقق من صلاحية المستخدم
  const cookie = request.headers.get("Cookie") || "";
  const isMaster = cookie.includes("auth_role=master");
  let restaurantSlug = null;
  const match = cookie.match(/auth_role=res_([^;]+)/);
  if (match) restaurantSlug = match[1];

  if (!isMaster && !restaurantSlug) {
    return new Response(JSON.stringify({ 
      error: "❌ غير مصرح: يجب تسجيل الدخول أولاً." 
    }), {
      status: 401,
      headers: { "Content-Type": "application/json" }
    });
  }

  // قراءة بيانات النموذج مرة واحدة فقط
  let formData;
  try {
    formData = await request.formData();
  } catch (e) {
    return new Response(JSON.stringify({ 
      error: "❌ فشل قراءة بيانات النموذج: " + e.message,
      stack: e.stack 
    }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }

  // الحصول على معرف المطعم
  let restaurantId;
  try {
    if (isMaster) {
      restaurantId = formData.get("restaurant_id");
    } else {
      const res = await env.DB.prepare("SELECT id FROM restaurants WHERE slug = ?").bind(restaurantSlug).first();
      if (!res) {
        return new Response(JSON.stringify({ 
          error: "❌ المطعم غير موجود." 
        }), { status: 404, headers: { "Content-Type": "application/json" } });
      }
      restaurantId = res.id;
    }
  } catch (dbError) {
    return new Response(JSON.stringify({ 
      error: "❌ خطأ في قاعدة البيانات: " + dbError.message 
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }

  const file = formData.get("image");
  if (!file) {
    return new Response(JSON.stringify({ 
      error: "❌ لم يتم اختيار أي صورة. يرجى اختيار ملف صورة." 
    }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }

  // التحقق من نوع الملف (يجب أن يكون صورة)
  if (!file.type.startsWith("image/")) {
    return new Response(JSON.stringify({ 
      error: "❌ نوع الملف غير مدعوم. يرجى رفع صورة فقط (jpg, png, gif, إلخ)." 
    }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }

  // التحقق من حجم الملف (حد أقصى 5 ميجابايت)
  const MAX_SIZE = 5 * 1024 * 1024; // 5 MB
  if (file.size > MAX_SIZE) {
    return new Response(JSON.stringify({ 
      error: "❌ حجم الصورة كبير جداً. الحد الأقصى المسموح به هو 5 ميجابايت." 
    }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }

  // قراءة محتوى الملف
  let bytes, buffer;
  try {
    bytes = await file.arrayBuffer();
    buffer = new Uint8Array(bytes);
  } catch (e) {
    return new Response(JSON.stringify({ 
      error: "❌ فشل قراءة محتوى الصورة: " + e.message 
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }

  // إنشاء اسم فريد للملف
  const safeFileName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
  const fileName = `${restaurantId}/${Date.now()}-${safeFileName}`;

  // رفع الملف إلى R2
  try {
    await env.R2.put(fileName, buffer, {
      httpMetadata: { contentType: file.type }
    });
  } catch (r2Error) {
    return new Response(JSON.stringify({ 
      error: "❌ فشل رفع الصورة إلى الخادم: " + r2Error.message 
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }

  // إنشاء الرابط العام باستخدام النطاق المخصص
  const publicUrl = `https://images.topsafetypro.com/${fileName}`;

  // إرجاع الرابط بنجاح
  return new Response(JSON.stringify({ 
    url: publicUrl,
    message: "✅ تم رفع الصورة بنجاح" 
  }), {
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
<head><meta charset="UTF-8"><title>تسجيل الدخول</title>
<style>
  body { font-family:Tahoma; background:#f4f7f6; display:flex; justify-content:center; align-items:center; height:100vh; }
  .card { background:white; padding:30px; border-radius:15px; box-shadow:0 5px 15px rgba(0,0,0,0.1); width:300px; text-align:center; }
  input, button { width:100%; margin:10px 0; padding:10px; border:1px solid #ddd; border-radius:5px; }
  button { background:#007bff; color:white; border:none; cursor:pointer; }
  .error { color:red; }
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
// 5. لوحة تحكم الماستر
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
        <a href="/admin/${r.slug}" style="margin-left:5px;">🔍 إدارة</a>
        <a href="/admin/${r.slug}/categories" style="margin-left:5px;">📁 الفئات</a>
        <a href="/admin/${r.slug}/settings" style="margin-left:5px;">⚙️ تخصيص</a>
        <button onclick="openEditModal(${r.id}, '${r.res_name.replace(/'/g, "\\'")}', '${r.slug}', '${r.admin_password}', '${r.expires_at}')" 
          style="background:orange; color:white; border:none; padding:5px 10px; border-radius:3px; cursor:pointer;">✏️ تعديل</button>
        <form method="POST" style="display:inline;" onsubmit="return confirm('هل أنت متأكد من الحذف؟');">
          <input type="hidden" name="action" value="delete">
          <input type="hidden" name="id" value="${r.id}">
          <button style="background:red; color:white; border:none; padding:5px 10px; border-radius:3px; cursor:pointer;">🗑️ حذف</button>
        </form>
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
    body { font-family:Tahoma; background:#f4f7f6; padding:20px; margin:0; }
    .container { max-width:1200px; margin:auto; }
    .stats { display:flex; gap:20px; margin-bottom:20px; flex-wrap:wrap; }
    .stat-card { background:white; padding:20px; border-radius:10px; box-shadow:0 2px 5px rgba(0,0,0,0.1); flex:1; min-width:150px; text-align:center; }
    .stat-card h3 { margin:0 0 10px; color:#555; }
    .stat-card .number { font-size:28px; font-weight:bold; color:#007bff; }
    .card { background:white; padding:20px; border-radius:10px; box-shadow:0 2px 10px rgba(0,0,0,0.1); margin-bottom:20px; }
    .filters { display:flex; gap:10px; margin-bottom:20px; flex-wrap:wrap; }
    .filters input, .filters select, .filters button { padding:8px 12px; border:1px solid #ddd; border-radius:5px; }
    table { width:100%; border-collapse:collapse; text-align:right; }
    th { background:#f0f0f0; padding:10px; }
    .modal { display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.5); justify-content:center; align-items:center; }
    .modal-content { background:white; padding:20px; border-radius:10px; width:400px; max-width:90%; }
    .error { color:red; margin-bottom:10px; }
    .alert { padding:10px; border-radius:5px; margin-bottom:20px; }
    .alert-danger { background:#f8d7da; color:#721c24; }
    .alert-warning { background:#fff3cd; color:#856404; }
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
        <input type="text" name="search" placeholder="بحث باسم المطعم أو slug" value="${searchParam}" style="flex:2;">
        <select name="status" style="flex:1;">
          <option value="all" ${statusParam==='all'? 'selected':''}>جميع المطاعم</option>
          <option value="active" ${statusParam==='active'? 'selected':''}>النشطة فقط</option>
          <option value="expired" ${statusParam==='expired'? 'selected':''}>المنتهية فقط</option>
        </select>
        <button type="submit" style="background:#007bff; color:white; border:none; padding:8px 20px; border-radius:5px;">تطبيق</button>
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
          <div><label>اسم المطعم:</label><br><input type="text" name="res_name" id="editResName" required style="width:100%; padding:8px;"></div>
          <div><label>الرابط (slug):</label><br><input type="text" name="slug" id="editSlug" required style="width:100%; padding:8px;"></div>
          <div><label>كلمة المرور:</label><br><input type="text" name="pass" id="editPass" required style="width:100%; padding:8px;"></div>
          <div><label>تاريخ الانتهاء:</label><br><input type="date" name="expires" id="editExpires" required style="width:100%; padding:8px;"></div>
          <div style="display:flex; gap:10px; justify-content:flex-end; margin-top:15px;">
            <button type="button" onclick="document.getElementById('editModal').style.display='none'" style="background:#6c757d; color:white; border:none; padding:8px 15px; border-radius:5px;">إلغاء</button>
            <button type="submit" style="background:#007bff; color:white; border:none; padding:8px 15px; border-radius:5px;">حفظ التعديلات</button>
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
// 6. إدارة الفئات
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
      <td>${c.name}</td>
      <td>
        <button onclick="openEditCatModal(${c.id}, '${c.name.replace(/'/g, "\\'")}')" style="background:orange; color:white; border:none; padding:5px 10px;">تعديل</button>
        <form method="POST" style="display:inline;" onsubmit="return confirm('سيتم إزالة الفئة من الوجبات المرتبطة. استمر؟');">
          <input type="hidden" name="action" value="delete">
          <input type="hidden" name="id" value="${c.id}">
          <button style="background:red; color:white; border:none; padding:5px 10px;">حذف</button>
        </form>
      </td>
    </tr>
  `).join('');

  return `<!DOCTYPE html>
<html dir="rtl">
<head><meta charset="UTF-8"><title>إدارة الفئات - ${res.res_name}</title>
<style>
  body { font-family:Tahoma; background:#f4f7f6; padding:20px; }
  .container { max-width:600px; margin:auto; background:white; padding:20px; border-radius:10px; }
  table { width:100%; border-collapse:collapse; }
  th { background:#f0f0f0; padding:10px; }
  td { padding:10px; border-bottom:1px solid #eee; }
  .modal { display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.5); justify-content:center; align-items:center; }
  .modal-content { background:white; padding:20px; border-radius:10px; width:400px; max-width:90%; }
</style>
</head>
<body>
  <div class="container">
    <h2>📁 إدارة الفئات - ${res.res_name}</h2>
    <form method="POST" style="display:flex; gap:10px; margin-bottom:20px;">
      <input type="hidden" name="action" value="add">
      <input type="text" name="name" placeholder="اسم الفئة" required style="flex:1; padding:8px;">
      <button type="submit" style="background:#28a745; color:white; border:none; padding:8px 15px;">إضافة فئة</button>
    </form>
    <table>
      <thead><tr><th>اسم الفئة</th><th>إجراءات</th></tr></thead>
      <tbody>${rows || '<tr><td colspan="2">لا توجد فئات</td></tr>'}</tbody>
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
        <input type="text" name="name" id="editCatName" required style="width:100%; padding:8px;">
        <div style="display:flex; gap:10px; margin-top:15px;">
          <button type="button" onclick="document.getElementById('editCatModal').style.display='none'">إلغاء</button>
          <button type="submit">حفظ</button>
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
// 7. لوحة تحكم المطعم
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

  if (request.method === "POST") {
    const data = await request.formData();
    const action = data.get("action");

    if (action === "add") {
      const name = data.get("name");
      const price = data.get("price");
      const categoryId = data.get("category_id") || null;
      const imageUrl = data.get("image_url") || null;

      await env.DB.prepare(
        "INSERT INTO items (restaurant_id, name, price, category_id, image_url) VALUES (?, ?, ?, ?, ?)"
      ).bind(res.id, name, price, categoryId, imageUrl).run();
      await logActivity(env, res.id, "item_add", `أضاف وجبة ${name}`);

    } else if (action === "edit") {
      const itemId = data.get("id");
      const name = data.get("name");
      const price = data.get("price");
      const categoryId = data.get("category_id");
      const imageUrl = data.get("image_url");

      await env.DB.prepare(
        "UPDATE items SET name = ?, price = ?, category_id = ?, image_url = ? WHERE id = ?"
      ).bind(name, price, categoryId, imageUrl, itemId).run();
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
    ORDER BY categories.sort_order, categories.name, items.name
  `).bind(res.id).all();

  const settings = await env.DB.prepare(
    "SELECT * FROM restaurant_settings WHERE restaurant_id = ?"
  ).bind(res.id).first() || { theme_name: 'default', primary_color: '#007bff', secondary_color: '#6c757d', font_family: 'Tahoma', logo_url: '' };

  return new Response(renderRestaurantHTML(res, items, categories, settings, origin), {
    headers: { "Content-Type": "text/html; charset=utf-8" }
  });
}

function renderRestaurantHTML(res, items, categories, settings, origin) {
  const menuUrl = `${origin}/menu/${res.slug}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(menuUrl)}`;

  const catOptions = categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
  
  const itemsList = items.map(i => `
    <li style="padding:10px; border-bottom:1px solid #eee; display:flex; align-items:center; gap:10px;">
      ${i.image_url ? `<img src="${i.image_url}" style="width:50px; height:50px; object-fit:cover; border-radius:5px;">` : ''}
      <div style="flex:1;">
        <strong>${i.name}</strong> - ${i.price} ريال
        ${i.category_name ? `<br><small>فئة: ${i.category_name}</small>` : ''}
      </div>
      <button onclick="openEditItemModal(${i.id}, '${i.name.replace(/'/g, "\\'")}', ${i.price}, ${i.category_id || 'null'}, '${i.image_url || ''}')" style="background:orange; color:white; border:none; padding:5px 10px;">تعديل</button>
      <form method="POST" style="margin:0;" onsubmit="return confirm('حذف الوجبة؟');">
        <input type="hidden" name="action" value="delete">
        <input type="hidden" name="id" value="${i.id}">
        <button style="background:red; color:white; border:none; padding:5px 10px;">حذف</button>
      </form>
    </li>
  `).join('');

  return `<!DOCTYPE html>
<html dir="rtl">
<head><meta charset="UTF-8"><title>إدارة ${res.res_name}</title>
<style>
  body { font-family:${settings.font_family}; padding:20px; background:#f8f9fa; }
  .container { max-width:800px; margin:auto; background:white; padding:20px; border-radius:10px; box-shadow:0 2px 10px rgba(0,0,0,0.1); }
  .header { display:flex; justify-content:space-between; align-items:center; }
  .logo-img { max-height:60px; }
  .qr-img { border:1px solid #ddd; padding:5px; border-radius:5px; }
  .add-form { background:#f9f9f9; padding:15px; border-radius:8px; margin-bottom:20px; }
  .add-form input, .add-form select, .add-form button { padding:8px; margin:5px; border:1px solid #ddd; border-radius:5px; }
  ul { list-style:none; padding:0; }
  .modal { display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.5); justify-content:center; align-items:center; z-index:1000; }
  .modal-content { background:white; padding:20px; border-radius:10px; width:500px; max-width:90%; max-height:80vh; overflow-y:auto; }
  .logout-btn { background:#6c757d; color:white; border:none; padding:10px; border-radius:5px; cursor:pointer; width:100%; margin-top:20px; }
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
        <input type="hidden" name="image_url" id="imageUrl">
        <button type="submit" style="background:#28a745; color:white;">إضافة</button>
      </form>
    </div>

    <ul>${itemsList || '<p style="text-align:center;">لا توجد وجبات بعد</p>'}</ul>

    <div id="editItemModal" class="modal">
      <div class="modal-content">
        <h3>✏️ تعديل الوجبة</h3>
        <form method="POST" enctype="multipart/form-data" onsubmit="event.preventDefault(); updateItem(this);">
          <input type="hidden" name="action" value="edit">
          <input type="hidden" name="id" id="editItemId">
          <div><label>الاسم:</label><br><input type="text" name="name" id="editItemName" required></div>
          <div><label>السعر:</label><br><input type="number" name="price" id="editItemPrice" required></div>
          <div><label>الفئة:</label><br><select name="category_id" id="editItemCategory">${catOptions}</select></div>
          <div><label>الصورة الحالية:</label><br><img id="editItemImagePreview" style="max-width:100px; max-height:100px;"></div>
          <div><label>تغيير الصورة:</label><br><input type="file" name="image" accept="image/*" id="editImageInput"></div>
          <input type="hidden" name="image_url" id="editImageUrl">
          <div style="margin-top:15px;">
            <button type="button" onclick="closeEditModal()">إلغاء</button>
            <button type="submit">حفظ</button>
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

    function openEditItemModal(id, name, price, categoryId, imageUrl) {
      document.getElementById('editItemId').value = id;
      document.getElementById('editItemName').value = name;
      document.getElementById('editItemPrice').value = price;
      document.getElementById('editItemCategory').value = categoryId || '';
      document.getElementById('editItemImagePreview').src = imageUrl || '';
      document.getElementById('editImageUrl').value = imageUrl || '';
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
// 8. إعدادات تخصيص المنيو
// ==========================================
async function handleSettingsRoute(request, env, slug) {
  const cookie = request.headers.get("Cookie") || "";
  const isMaster = cookie.includes("auth_role=master");
  const isOwner = cookie.includes(`auth_role=res_${slug}`);
  if (!isMaster && !isOwner) return Response.redirect(new URL("/", request.url));

  const res = await env.DB.prepare("SELECT * FROM restaurants WHERE slug = ?").bind(slug).first();
  if (!res) return new Response("المطعم غير موجود", { status: 404 });

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

    return Response.redirect(new URL(`/admin/${slug}/settings`, request.url));
  }

  const settings = await env.DB.prepare("SELECT * FROM restaurant_settings WHERE restaurant_id = ?").bind(res.id).first() || {
    theme_name: 'default', primary_color: '#007bff', secondary_color: '#6c757d', font_family: 'Tahoma', logo_url: ''
  };

  return new Response(renderSettingsHTML(res, settings), {
    headers: { "Content-Type": "text/html; charset=utf-8" }
  });
}

function renderSettingsHTML(res, settings) {
  return `<!DOCTYPE html>
<html dir="rtl">
<head><meta charset="UTF-8"><title>تخصيص المنيو - ${res.res_name}</title>
<style>
  body { font-family:Tahoma; background:#f4f7f6; padding:20px; }
  .container { max-width:500px; margin:auto; background:white; padding:20px; border-radius:10px; }
  label { display:block; margin-top:10px; }
  input, select { width:100%; padding:8px; margin-top:5px; border:1px solid #ddd; border-radius:5px; }
  button { margin-top:20px; padding:10px; background:#007bff; color:white; border:none; border-radius:5px; cursor:pointer; }
  .logo-preview { max-width:150px; max-height:150px; margin-top:10px; }
</style>
</head>
<body>
  <div class="container">
    <h2>⚙️ تخصيص شكل المنيو</h2>
    <form method="POST" enctype="multipart/form-data" onsubmit="event.preventDefault(); uploadLogoAndSubmit(this);">
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
      ${settings.logo_url ? `<img src="${settings.logo_url}" class="logo-preview"><br>` : ''}
      <input type="file" name="logo" accept="image/*" id="logoInput">
      <input type="hidden" name="logo_url" id="logoUrl" value="${settings.logo_url}">

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
// 9. صفحة المنيو العامة
// ==========================================
async function handlePublicMenuRoute(env, slug) {
  const res = await env.DB.prepare("SELECT * FROM restaurants WHERE slug = ?").bind(slug).first();
  if (!res) return new Response("المطعم غير موجود", { status: 404 });

  const settings = await env.DB.prepare("SELECT * FROM restaurant_settings WHERE restaurant_id = ?").bind(res.id).first() || {
    theme_name: 'default', primary_color: '#007bff', secondary_color: '#6c757d', font_family: 'Tahoma', logo_url: ''
  };

  const { results: categories } = await env.DB.prepare(`
    SELECT c.*, 
           (SELECT json_group_array(json_object('id', i.id, 'name', i.name, 'price', i.price, 'image_url', i.image_url))
            FROM items i WHERE i.category_id = c.id) as items_json
    FROM categories c
    WHERE c.restaurant_id = ?
    ORDER BY c.sort_order, c.name
  `).bind(res.id).all();

  const { results: uncategorized } = await env.DB.prepare(`
    SELECT * FROM items WHERE restaurant_id = ? AND category_id IS NULL
  `).bind(res.id).all();

  return new Response(renderPublicMenuHTML(res, categories, uncategorized, settings), {
    headers: { "Content-Type": "text/html; charset=utf-8" }
  });
}

function renderPublicMenuHTML(res, categories, uncategorized, settings) {
  const themeStyles = `
    :root {
      --primary: ${settings.primary_color};
      --secondary: ${settings.secondary_color};
      --font: ${settings.font_family};
    }
    body {
      font-family: var(--font), Tahoma;
      background: #fafafa;
      margin: 0;
      padding: 20px;
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
    }
    .logo {
      max-height: 80px;
    }
    .category {
      margin-bottom: 40px;
    }
    .category h2 {
      color: var(--primary);
      border-bottom: 2px solid var(--primary);
      padding-bottom: 5px;
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
      width: 200px;
      padding: 10px;
      text-align: center;
      box-shadow: 0 2px 5px rgba(0,0,0,0.1);
    }
    .item-card img {
      width: 100%;
      height: 150px;
      object-fit: cover;
      border-radius: 8px;
    }
    .item-card h3 {
      margin: 10px 0 5px;
    }
    .item-card .price {
      color: green;
      font-weight: bold;
    }
  `;

  let categoriesHtml = '';
  for (let cat of categories) {
    let items = [];
    try {
      items = JSON.parse(cat.items_json) || [];
    } catch { items = []; }
    const itemsHtml = items.map(item => `
      <div class="item-card">
        ${item.image_url ? `<img src="${item.image_url}" alt="${item.name}">` : ''}
        <h3>${item.name}</h3>
        <p class="price">${item.price} ريال</p>
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
      <div class="item-card">
        ${item.image_url ? `<img src="${item.image_url}" alt="${item.name}">` : ''}
        <h3>${item.name}</h3>
        <p class="price">${item.price} ريال</p>
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
<head><meta charset="UTF-8"><title>${res.res_name}</title>
<style>${themeStyles}</style>
</head>
<body>
  <div class="header">
    ${settings.logo_url ? `<img src="${settings.logo_url}" class="logo">` : ''}
    <h1 style="color:var(--primary);">${res.res_name}</h1>
  </div>
  <div class="menu-container">
    ${categoriesHtml || '<p style="text-align:center;">قائمة الطعام قريباً...</p>'}
  </div>
</body>
</html>`;
}
