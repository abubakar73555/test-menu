export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url);

    // --- منطق حفظ الوجبة مع الصورة ---
    if (request.method === "POST" && pathname === "/add-item") {
      const formData = await request.formData();
      const name = formData.get("name");
      const price = formData.get("price");
      const imageFile = formData.get("image");

      let imageKey = null;
      if (imageFile && imageFile.size > 0) {
        imageKey = `img_${Date.now()}`;
        await env.BUCKET.put(imageKey, imageFile.stream());
      }

      await env.DB.prepare(
        "INSERT INTO menu_items (item_name, price, image_key) VALUES (?, ?, ?)"
      ).bind(name, price, imageKey).run();

      return new Response("✅ تم حفظ الوجبة والصورة بنجاح!");
    }

    // --- عرض الصور من R2 ---
    if (pathname.startsWith("/view-img/")) {
      const key = pathname.replace("/view-img/", "");
      const object = await env.BUCKET.get(key);
      if (!object) return new Response("الصورة غير موجودة", { status: 404 });
      return new Response(object.body, { headers: { "Content-Type": "image/jpeg" } });
    }

    // --- صفحة لوحة التحكم المحدثة ---
    if (pathname === "/admin") {
      return new Response(`
        <html dir="rtl" lang="ar">
        <head><meta charset="UTF-8"><style>
          body { font-family: Arial; background: #f4f7f6; text-align: center; padding: 50px; }
          .card { background: white; padding: 30px; border-radius: 15px; display: inline-block; box-shadow: 0 4px 10px rgba(0,0,0,0.1); width: 350px; }
          input { width: 100%; padding: 10px; margin: 10px 0; border: 1px solid #ddd; border-radius: 5px; box-sizing: border-box; }
          button { width: 100%; padding: 12px; background: #27ae60; color: white; border: none; border-radius: 5px; cursor: pointer; font-weight: bold; }
        </style></head>
        <body>
          <div class="card">
            <h2>👨‍🍳 إضافة وجبة بالصورة</h2>
            <form id="itemForm">
              <input type="text" id="name" placeholder="اسم الوجبة" required>
              <input type="number" id="price" placeholder="السعر" required>
              <p style="text-align:right; font-size:12px; margin:0;">صورة الوجبة:</p>
              <input type="file" id="image" accept="image/*">
              <button type="button" onclick="upload()">حفظ في المنيو</button>
            </form>
            <p id="status"></p>
          </div>
          <script>
            async function upload() {
              const status = document.getElementById('status');
              const fd = new FormData();
              fd.append('name', document.getElementById('name').value);
              fd.append('price', document.getElementById('price').value);
              fd.append('image', document.getElementById('image').files[0]);
              
              status.innerText = "جاري الرفع...";
              const res = await fetch('/add-item', { method: 'POST', body: fd });
              status.innerText = await res.text();
              if(res.ok) document.getElementById('itemForm').reset();
            }
          </script>
        </body></html>
      `, { headers: { "Content-Type": "text/html; charset=utf-8" } });
    }

    // --- صفحة المنيو الرئيسي للزبائن ---
    const { results } = await env.DB.prepare("SELECT * FROM menu_items").all();
    const list = results.map(item => `
      <div style="border: 1px solid #eee; padding: 15px; margin: 10px; border-radius: 10px; display: inline-block; width: 200px;">
        ${item.image_key ? `<img src="/view-img/${item.image_key}" style="width:100%; border-radius:8px;">` : ''}
        <h3>${item.item_name}</h3>
        <p style="color: #27ae60; font-weight: bold;">${item.price} ريال</p>
      </div>
    `).join('');

    return new Response(`
      <html dir="rtl"><body style="text-align:center; font-family:Arial; padding:50px;">
        <h1>🍽️ منيو مطعمنا</h1>
        <div style="display: flex; flex-wrap: wrap; justify-content: center;">${list || "لا توجد وجبات"}</div>
        <hr><a href="/admin">دخول الإدارة</a>
      </body></html>
    `, { headers: { "Content-Type": "text/html; charset=utf-8" } });
  }
};
