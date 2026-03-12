export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const pathname = url.pathname;
    const parts = pathname.split('/').filter(Boolean);

    // --- 1. صفحة التسجيل للمطاعم الجديدة (SaaS Landing) ---
    if (pathname === "/" && request.method === "GET") {
      return new Response(renderLanding(), { headers: { "Content-Type": "text/html; charset=utf-8" } });
    }

    if (pathname === "/register" && request.method === "POST") {
      const data = await request.formData();
      const name = data.get("res_name");
      const slug = data.get("slug").toLowerCase().replace(/\s+/g, '-');
      const pass = data.get("password");

      try {
        await env.DB.prepare("INSERT INTO restaurants (res_name, slug, admin_password) VALUES (?, ?, ?)")
          .bind(name, slug, pass).run();
        return new Response(`<h1>تم إنشاء مطعمك!</h1><p>رابط المنيو: /menu/${slug}</p><p>لوحة التحكم: /admin/${slug}</p>`, { headers: { "Content-Type": "text/html; charset=utf-8" } });
      } catch (e) { return new Response("الرابط محجوز مسبقاً، اختر اسماً آخر."); }
    }

    // --- 2. لوحة تحكم المطعم الخاص: /admin/[slug] ---
    if (parts[0] === "admin" && parts[1]) {
      const slug = parts[1];
      const res = await env.DB.prepare("SELECT * FROM restaurants WHERE slug = ?").bind(slug).first();
      if (!res) return new Response("المطعم غير موجود", { status: 404 });

      // إضافة وجبة جديدة
      if (request.method === "POST") {
        const data = await request.formData();
        if (data.get("action") === "add") {
          await env.DB.prepare("INSERT INTO items (restaurant_id, name, price) VALUES (?, ?, ?)")
            .bind(res.id, data.get("name"), data.get("price")).run();
        } else if (data.get("action") === "delete") {
          await env.DB.prepare("DELETE FROM items WHERE id = ? AND restaurant_id = ?").bind(data.get("id"), res.id).run();
        }
      }

      const { results: items } = await env.DB.prepare("SELECT * FROM items WHERE restaurant_id = ?").bind(res.id).all();
      return new Response(renderAdmin(res, items), { headers: { "Content-Type": "text/html; charset=utf-8" } });
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
  return `<html dir="rtl"><body style="font-family:Tahoma; text-align:center; padding:50px; background:#f0f2f5;">
    <h1>🚀 منصة المنيو الذكي (SaaS)</h1>
    <p>سجل مطعمك الآن واحصل على QR Code فوراً</p>
    <form action="/register" method="POST" style="background:white; padding:20px; display:inline-block; border-radius:10px;">
      <input name="res_name" placeholder="اسم المطعم" required><br><br>
      <input name="slug" placeholder="اسم الرابط (مثلاً: my-cafe)" required><br><br>
      <input name="password" type="password" placeholder="كلمة مرور الإدارة" required><br><br>
      <button style="background:#007bff; color:white; border:none; padding:10px 20px; border-radius:5px;">إنشاء حساب المطعم</button>
    </form>
  </body></html>`;
}

function renderAdmin(res, items) {
  const rows = items.map(i => `<li>${i.name} - ${i.price} ريال 
    <form method="POST" style="display:inline;"><input type="hidden" name="id" value="${i.id}"><input type="hidden" name="action" value="delete"><button>حذف</button></form></li>`).join('');
  return `<html dir="rtl"><body style="font-family:Tahoma; padding:30px;">
    <h2>لوحة تحكم: ${res.res_name}</h2>
    <p>رابط الزبائن: <a href="/menu/${res.slug}">/menu/${res.slug}</a></p>
    <hr>
    <h3>إضافة طبق جديد</h3>
    <form method="POST"><input type="hidden" name="action" value="add"><input name="name" placeholder="الاسم"><input name="price" placeholder="السعر"><button>إضافة</button></form>
    <h3>الأطباق الحالية:</h3><ul>${rows}</ul>
  </body></html>`;
}

function renderPublicMenu(res, items) {
  const cards = items.map(i => `<div style="border:1px solid #ddd; padding:10px; margin:10px; border-radius:8px;"><h3>${i.name}</h3><p>${i.price} ريال</p></div>`).join('');
  return `<html dir="rtl"><body style="font-family:Tahoma; text-align:center;">
    <h1>منيو ${res.res_name}</h1><div style="display:flex; flex-wrap:wrap; justify-content:center;">${cards}</div>
  </body></html>`;
}
