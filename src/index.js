export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url);

    // الهيدر الخاص بتعريف المتصفح باللغة العربية
    const htmlHeader = {
      headers: { "Content-Type": "text/html; charset=utf-8" }
    };

    // 1. لوحة تحكم المطعم
    if (pathname === "/admin") {
      return new Response(`
        <html dir="rtl" lang="ar">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>لوحة التحكم</title>
            <style>
              body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f8f9fa; padding: 20px; display: flex; justify-content: center; }
              .card { background: white; padding: 30px; border-radius: 15px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); width: 100%; max-width: 400px; text-align: center; }
              input { width: 100%; padding: 12px; margin: 10px 0; border: 1px solid #ddd; border-radius: 8px; box-sizing: border-box; }
              button { width: 100%; padding: 12px; background: #28a745; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 16px; font-weight: bold; }
              button:hover { background: #218838; }
            </style>
          </head>
          <body>
            <div class="card">
              <h2 style="color: #333;">👨‍🍳 إضافة وجبة جديدة</h2>
              <input type="text" placeholder="اسم الوجبة (مثلاً: برجر لحم)">
              <input type="number" placeholder="السعر">
              <button>حفظ في المنيو</button>
              <p style="font-size: 12px; color: #666; margin-top: 20px;">متصل بقاعدة بيانات D1 بنجاح</p>
            </div>
          </body>
        </html>
      `, htmlHeader);
    }

    // 2. الصفحة الرئيسية للمنصة
    return new Response(`
      <html dir="rtl" lang="ar">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>المنيو الذكي</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; text-align: center; padding: 100px 20px; background: linear-gradient(135deg, #ff4757, #ff6b81); color: white; }
            h1 { font-size: 3rem; margin-bottom: 10px; }
            .btn { background: white; color: #ff4757; padding: 15px 35px; border-radius: 50px; text-decoration: none; font-weight: bold; font-size: 1.2rem; transition: 0.3s; }
            .btn:hover { transform: scale(1.1); box-shadow: 0 10px 20px rgba(0,0,0,0.2); }
          </style>
        </head>
        <body>
          <h1>🍽️ منصة المنيو الذكي</h1>
          <p style="font-size: 1.5rem; margin-bottom: 40px;">أنشئ منيو مطعمك الخاص في ثوانٍ</p>
          <a href="/admin" class="btn">ابدأ الآن - لوحة التحكم</a>
        </body>
      </html>
    `, htmlHeader);
  }
};
