export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const pathname = url.pathname;
    const parts = pathname.split('/').filter(Boolean);

    // --- 1. الصفحة الرئيسية (Landing Page) ---
    if (pathname === "/" && request.method === "GET") {
      return new Response(renderLanding(), { headers: { "Content-Type": "text/html; charset=utf-8" } });
    }

    // --- 2. منطق التسجيل (المكان الذي يظهر فيه الخطأ) ---
    if (pathname === "/register" && request.method === "POST") {
      try {
        const data = await request.formData();
        const name = data.get("res_name");
        // تحويل النص لرابط صالح (slug)
        const slug = data.get("slug").toLowerCase().trim().replace(/\s+/g, '-');
        const pass = data.get("password");

        // محاولة الحفظ في D1
        await env.DB.prepare("INSERT INTO restaurants (res_name, slug, admin_password) VALUES (?, ?, ?)")
          .bind(name, slug, pass).run();

        return new Response(`
          <html dir="rtl"><body style="font-family:Tahoma; text-align:center; padding:50px;">
            <h1 style="color:green;">✅ تم إنشاء مطعمك بنجاح!</h1>
            <p>اسم المطعم: <b>${name}</b></p>
            <div style="background:#eee; padding:20px; display:inline-block; border-radius:10px;">
              <p>🔗 رابط المنيو: <a href="/menu/${slug}">/menu/${slug}</a></p>
              <p>⚙️ لوحة التحكم: <a href="/admin/${slug}">/admin/${slug}</a></p>
            </div>
            <br><br><a href="/">العودة للرئيسية</a>
          </body></html>`, { headers: { "Content-Type": "text/html; charset=utf-8" } });

      } catch (e) {
        // إذا فشل الكود، سيعطيك السبب الحقيقي باللون الأحمر
        return new Response(`
          <html dir="rtl"><body style="font-family:Tahoma; text-align:center; padding:50px;">
            <h1 style="color:red;">❌ حدث خطأ تقني</h1>
            <p style="background:#fff3f3; border:1px solid red; padding:15px; display:inline-block;">
              السبب الحقيقي: <b>${e.message}</b>
            </p>
            <p>إذا كان الخطأ "no such table"، فأنت لم تنشئ الجداول بعد في Console.</p>
            <p>إذا كان الخطأ "D1_ERROR"، فتأكد من المعرف (ID) في wrangler.toml.</p>
            <br><button onclick="history.back()">العودة للمحاولة</button>
          </body></html>`, { headers: { "Content-Type": "text/html; charset=utf-8" }, status: 500 });
      }
    }

    // --- 3. لوحة التحكم (Admin) ---
    if (parts[0] === "admin" && parts[1]) {
      const slug = parts[1];
      const res = await env.DB.prepare("SELECT * FROM restaurants WHERE slug = ?").bind(slug).first();
      if (!res) return new Response("المطعم غير موجود", { status: 404 });

      if (request.method === "POST") {
        const data = await request.formData();
        const action = data.get("action");
        if (action === "add") {
          await env.DB.prepare("INSERT INTO items (restaurant_id, name, price) VALUES (?, ?, ?)")
            .bind(res.id, data.get("name"), data.get("price")).run();
        } else if (action === "delete") {
          await env.DB.prepare("DELETE FROM items WHERE id = ? AND restaurant_id = ?").bind(data.get("id"), res.id).run();
        }
      }

      const { results: items } = await env.DB.prepare("SELECT * FROM items WHERE restaurant_id = ?").bind(res.id).all();
      return new Response(renderAdmin(res, items, url.origin), { headers: { "Content-Type": "text/html; charset=utf-8" } });
    }

    // --- 4. عرض المنيو (Public Menu) ---
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

// --- القوالب (Templates) ---

function renderLanding() {
  return `<html dir="rtl"><head><meta charset="UTF-8"><style>
    body { font-family: Tahoma; text-align: center; padding: 50px; background: #f0f2f5; }
    form { background: white; padding: 30px; display: inline-block; border-radius: 15px; box-shadow: 0 4px 10px rgba(0,0,0,0.1); }
    input { width: 100%; padding: 10px; margin: 10px 0; border: 1px solid #ddd; border-radius: 5px; }
    button { background: #007bff; color: white; border: none; padding: 12px 25px; border-radius: 5px; cursor: pointer; width: 100%; }
  </style></head>
  <body>
    <h1>🚀 منصة المنيو الذكي</h1>
    <form action="/register" method="POST">
      <input name="res_name" placeholder="اسم المطعم" required>
      <input name="slug" placeholder="الرابط (مثلاً: pizza-club)" required>
      <input name="password" type="password" placeholder="كلمة المرور" required>
      <button type="submit">إنشاء الحساب</button>
    </form>
  </body></html>`;
}

function renderAdmin(res, items, origin) {
  const menuUrl = `${origin}/menu/${res.slug}`;
  const qrUrl = `https://chart.googleapis.com/chart?chs=200x200&cht=qr&chl=${encodeURIComponent(menuUrl)}&choe=UTF-8`;
  const rows = items.map(i => `<li>${i.name} - ${i.price} ريال <form method="POST" style="display:inline;"><input type="hidden" name="id" value="${i.id}"><input type="hidden" name="action" value="delete"><button>حذف</button></form></li>`).join('');
  
  return `<html dir="rtl"><body style="font-family:Tahoma; padding:20px;">
    <h2>لوحة تحكم: ${res.res_name}</h2>
    <div style="border:1px dashed #ccc; padding:10px; text-align:center; margin-bottom:20px;">
      <p>كود QR الخاص بك:</p>
      <img src="${qrUrl}"><br><small>${menuUrl}</small>
    </div>
    <form method="POST"><input type="hidden" name="action" value="add"><input name="name" placeholder="الصنف"><input name="price" placeholder="السعر"><button>إضافة</button></form>
    <ul>${rows}</ul>
  </body></html>`;
}

function renderPublicMenu(res, items) {
  const cards = items.map(i => `<div style="border:1px solid #ddd; padding:15px; margin:10px; border-radius:10px;"><h3>${i.name}</h3><p>${i.price} ريال</p></div>`).join('');
  return `<html dir="rtl"><body style="font-family:Tahoma; text-align:center;"><h1>منيو ${res.res_name}</h1><div style="display:flex; flex-wrap:wrap; justify-content:center;">${cards || "قريباً..."}</div></body></html>`;
}
