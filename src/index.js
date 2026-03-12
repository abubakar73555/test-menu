export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const pathname = url.pathname;
    const parts = pathname.split('/').filter(Boolean);

    // --- 1. صفحة التسجيل للمطاعم الجديدة (SaaS Landing) ---
    if (pathname === "/" && request.method === "GET") {
      return new Response(renderLanding(), { headers: { "Content-Type": "text/html; charset=utf-8" } });
    }

    // المنطق المطور للتسجيل (التعديل الذي طلبته)
    if (pathname === "/register" && request.method === "POST") {
      try {
        const data = await request.formData();
        const name = data.get("res_name");
        // تنظيف الـ slug وتحويله لشكل صالح للروابط
        const slug = data.get("slug").toLowerCase().trim().replace(/\s+/g, '-');
        const pass = data.get("password");

        await env.DB.prepare("INSERT INTO restaurants (res_name, slug, admin_password) VALUES (?, ?, ?)")
          .bind(name, slug, pass).run();

        return new Response(`
          <html dir="rtl"><body style="font-family:Tahoma; text-align:center; padding:50px;">
            <h1 style="color:green;">✅ تم إنشاء مطعمك بنجاح!</h1>
            <p style="font-size:18px;">اسم المطعم: <b>${name}</b></p>
            <div style="background:#eee; padding:20px; display:inline-block; border-radius:10px;">
              <p>🔗 رابط المنيو للزبائن: <a href="/menu/${slug}">/menu/${slug}</a></p>
              <p>⚙️ لوحة التحكم للإدارة: <a href="/admin/${slug}">/admin/${slug}</a></p>
            </div>
            <br><br><a href="/">العودة للرئيسية</a>
          </body></html>`, { headers: { "Content-Type": "text/html; charset=utf-8" } });

      } catch (e) {
        return new Response(`
          <html dir="rtl"><body style="font-family:Tahoma; text-align:center; padding:50px;">
            <h1 style="color:red;">❌ عذراً، الرابط محجوز مسبقاً!</h1>
            <p>الاسم الذي اخترته مستخدم من قبل مطعم آخر، يرجى اختيار اسم رابط (Slug) مختلف.</p>
            <button onclick="history.back()">العودة للمحاولة مرة أخرى</button>
          </body></html>`, { headers: { "Content-Type": "text/html; charset=utf-8" } });
      }
    }

    // --- 2. لوحة تحكم المطعم الخاص: /admin/[slug] ---
    if (parts[0] === "admin" && parts[1]) {
      const slug = parts[1];
      const res = await env.DB.prepare("SELECT * FROM restaurants WHERE slug = ?").bind(slug).first();
      if (!res) return new Response("المطعم غير موجود", { status: 404 });

      // معالجة إضافة وحذف الوجبات
      if (request.method === "POST") {
        const data = await request.formData();
        const action = data.get("action");
        if (action === "add") {
          await env.DB.prepare("INSERT INTO items (restaurant_id, name, price) VALUES (?, ?, ?)")
            .bind(res.id, data.get("name"), data.get("price")).run();
        } else if (action === "delete") {
          await env.DB.prepare("DELETE FROM items WHERE id = ? AND restaurant_id = ?")
            .bind(data.get("id"), res.id).run();
        }
      }

      const { results: items } = await env.DB.prepare("SELECT * FROM items WHERE restaurant_id = ?").bind(res.id).all();
      return new Response(renderAdmin(res, items, url.origin), { headers: { "Content-Type": "text/html; charset=utf-8" } });
    }

    // --- 3. عرض منيو المطعم للزبائن: /menu/[slug] ---
    if (parts[0] === "menu" && parts[1]) {
      const slug = parts[1];
      const res = await env.DB.prepare("SELECT * FROM restaurants WHERE slug = ?").bind(slug).first();
      if (!res) return new Response("المطعم غير موجود", { status: 404 });

      const { results: items } = await env.DB.prepare("SELECT * FROM items WHERE restaurant_id = ?").bind(res.id).all();
      return new Response(renderPublicMenu(res, items), { headers: { "Content-Type": "text/html; charset=utf-8" } });
    }

    return new Response("الصفحة غير موجودة", { status: 404 });
  }
};

// --- القوالب التصميمية (Templates) ---

function renderLanding() {
  return `<html dir="rtl"><head><meta charset="UTF-8"><style>
    body { font-family: Tahoma; text-align: center; padding: 50px; background: #f0f2f5; }
    form { background: white; padding: 30px; display: inline-block; border-radius: 15px; box-shadow: 0 4px 10px rgba(0,0,0,0.1); }
    input { width: 100%; padding: 10px; margin: 10px 0; border: 1px solid #ddd; border-radius: 5px; }
    button { background: #007bff; color: white; border: none; padding: 12px 25px; border-radius: 5px; cursor: pointer; width: 100%; font-weight: bold; }
  </style></head>
  <body>
    <h1>🚀 منصة المنيو الذكي (SaaS)</h1>
    <p>أنشئ منيو مطعمك في ثوانٍ واحصل على كود QR خاص بك</p>
    <form action="/register" method="POST">
      <input name="res_name" placeholder="اسم المطعم (مثلاً: مطعم الذواق)" required>
      <input name="slug" placeholder="اسم الرابط بالإنجليزية (مثلاً: althawaq)" required>
      <input name="password" type="password" placeholder="كلمة مرور لوحة التحكم" required>
      <button type="submit">ابدأ الآن مجاناً</button>
    </form>
  </body></html>`;
}

function renderAdmin(res, items, origin) {
  const menuUrl = `${origin}/menu/${res.slug}`;
  const qrUrl = `https://chart.googleapis.com/chart?chs=200x200&cht=qr&chl=${encodeURIComponent(menuUrl)}&choe=UTF-8`;

  const rows = items.map(i => `
    <li style="background:#f9f9f9; padding:10px; margin:5px 0; border-radius:5px; display:flex; justify-content:space-between; align-items:center;">
      <span><b>${i.name}</b> - ${i.price} ريال</span>
      <form method="POST" style="margin:0;">
        <input type="hidden" name="id" value="${i.id}">
        <input type="hidden" name="action" value="delete">
        <button style="background:red; color:white; border:none; border-radius:3px; cursor:pointer;">حذف</button>
      </form>
    </li>`).join('');

  return `<html dir="rtl"><head><meta charset="UTF-8"><style>
    body { font-family: Tahoma; padding: 20px; background: #f4f7f6; }
    .card { background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); max-width: 600px; margin: auto; }
    .qr-box { text-align: center; background: #e3f2fd; padding: 15px; border-radius: 10px; margin-bottom: 20px; }
    input { padding: 8px; border: 1px solid #ddd; border-radius: 4px; }
  </style></head>
  <body>
    <div class="card">
      <h2>⚙️ لوحة تحكم: ${res.res_name}</h2>
      
      <div class="qr-box">
        <p><b>كود QR الخاص بمنيو مطعمك:</b></p>
        <img src="${qrUrl}" alt="QR Code"><br>
        <small><a href="${menuUrl}" target="_blank">${menuUrl}</a></small>
      </div>

      <h3>➕ إضافة طبق جديد</h3>
      <form method="POST">
        <input type="hidden" name="action" value="add">
        <input name="name" placeholder="اسم الطبق" required>
        <input name="price" type="number" placeholder="السعر" required>
        <button style="background:green; color:white; border:none; padding:8px 15px; border-radius:4px;">إضافة</button>
      </form>

      <hr>
      <h3>🍽️ الأطباق الحالية</h3>
      <ul style="padding:0;">${rows || "لا توجد أطباق بعد."}</ul>
      <br><a href="/">العودة للرئيسية</a>
    </div>
  </body></html>`;
}

function renderPublicMenu(res, items) {
  const cards = items.map(i => `
    <div style="background:white; border:1px solid #eee; padding:15px; margin:10px; border-radius:12px; width:200px; box-shadow:0 2px 5px rgba(0,0,0,0.05);">
      <h3 style="margin:0 0 10px 0;">${i.name}</h3>
      <p style="color:#2ecc71; font-weight:bold; margin:0;">${i.price} ريال</p>
    </div>`).join('');

  return `<html dir="rtl"><head><meta charset="UTF-8"></head>
  <body style="font-family:Tahoma; text-align:center; background:#fafafa; padding:20px;">
    <h1 style="color:#2c3e50;">🍽️ منيو ${res.res_name}</h1>
    <div style="display:flex; flex-wrap:wrap; justify-content:center;">${cards || "قريباً..."}</div>
    <p style="margin-top:50px; font-size:12px; color:#aaa;">بواسطة منصة المنيو الذكي</p>
  </body></html>`;
}
