export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url);

    // 1. استقبال البيانات وحفظها في قاعدة البيانات (عند الضغط على الزر)
    if (request.method === "POST" && pathname === "/add-item") {
      try {
        const formData = await request.formData();
        const name = formData.get("name");
        const price = formData.get("price");

        if (!name || !price) {
          return new Response("يرجى إدخال الاسم والسعر", { status: 400 });
        }

        // إدخال البيانات في جدول menu_items الذي أنشأته
        await env.DB.prepare(
          "INSERT INTO menu_items (item_name, price) VALUES (?, ?)"
        ).bind(name, parseFloat(price)).run();
        
        return new Response("✅ تم إضافة الوجبة بنجاح!", { status: 200 });
      } catch (e) {
        return new Response("❌ خطأ في الحفظ: " + e.message, { status: 500 });
      }
    }

    // 2. تصميم لوحة التحكم (Admin Panel)
    if (pathname === "/admin") {
      return new Response(`
        <html dir="rtl" lang="ar">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>إدارة المنيو</title>
            <style>
              body { font-family: sans-serif; background: #f4f7f6; display: flex; justify-content: center; padding-top: 50px; }
              .card { background: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 10px rgba(0,0,0,0.1); width: 100%; max-width: 350px; text-align: center; }
              input { width: 100%; padding: 12px; margin: 10px 0; border: 1px solid #ddd; border-radius: 6px; box-sizing: border-box; }
              button { width: 100%; padding: 12px; background: #27ae60; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 16px; font-weight: bold; }
              #status { margin-top: 15px; color: #2c3e50; font-weight: bold; }
            </style>
          </head>
          <body>
            <div class="card">
              <h2>👨‍🍳 إضافة وجبة جديدة</h2>
              <input type="text" id="itemName" placeholder="اسم الوجبة (مثلاً: بيتزا)">
              <input type="number" id="itemPrice" placeholder="السعر">
              <button onclick="saveItem()">حفظ في قاعدة البيانات</button>
              <div id="status"></div>
            </div>

            <script>
              async function saveItem() {
                const name = document.getElementById('itemName').value;
                const price = document.getElementById('itemPrice').value;
                const statusDiv = document.getElementById('status');

                statusDiv.innerText = "جاري الحفظ...";

                const formData = new FormData();
                formData.append('name', name);
                formData.append('price', price);

                try {
                  const response = await fetch('/add-item', { method: 'POST', body: formData });
                  const result = await response.text();
                  statusDiv.innerText = result;
                  if(response.ok) {
                    document.getElementById('itemName').value = '';
                    document.getElementById('itemPrice').value = '';
                  }
                } catch (err) {
                  statusDiv.innerText = "حدث خطأ في الاتصال";
                }
              }
            </script>
          </body>
        </html>
      `, { headers: { "Content-Type": "text/html; charset=utf-8" } });
    }

    // 3. عرض المنيو العام للزبائن (الصفحة الرئيسية)
    try {
      const { results } = await env.DB.prepare("SELECT * FROM menu_items").all();
      const listHtml = results.length > 0 
        ? results.map(item => `<div style="border-bottom:1px solid #eee; padding:10px;"><b>${item.item_name}</b> - ${item.price} ريال</div>`).join('')
        : "<p>لا توجد وجبات حالياً</p>";

      return new Response(`
        <html dir="rtl" lang="ar">
          <head><meta charset="UTF-8"></head>
          <body style="text-align:center; font-family:sans-serif; padding:20px;">
            <h1 style="color:#ff4757;">🍽️ قائمة الطعام</h1>
            <div style="max-width:500px; margin:0 auto; background:#fff; padding:20px; border-radius:10px; box-shadow:0 2px 5px rgba(0,0,0,0.1);">
              ${listHtml}
            </div>
            <br>
            <a href="/admin" style="color:#1a73e8;">دخول الإدارة</a>
          </body>
        </html>
      `, { headers: { "Content-Type": "text/html; charset=utf-8" } });
    } catch (e) {
      return new Response("خطأ في جلب البيانات: " + e.message);
    }
  }
};
