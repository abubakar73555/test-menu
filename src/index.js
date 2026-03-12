export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url);

    // 1. لوحة تحكم المطعم
    if (pathname === "/admin") {
      return new Response(`
        <html dir="rtl">
          <head><meta charset="UTF-8"></head>
          <body style="font-family: Arial; text-align: center; padding: 50px; background: #f0f2f5;">
            <div style="background: white; padding: 30px; border-radius: 15px; display: inline-block; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
              <h1 style="color: #1a73e8;">👨‍🍳 لوحة التحكم</h1>
              <p>مرحباً بك! نظامك متصل بقاعدة بيانات D1 بنجاح.</p>
              <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
              <input type="text" placeholder="اسم الوجبة" style="padding: 12px; width: 80%; border: 1px solid #ddd; border-radius: 5px;"><br><br>
              <input type="number" placeholder="السعر" style="padding: 12px; width: 80%; border: 1px solid #ddd; border-radius: 5px;"><br><br>
              <button style="padding: 12px 25px; background: #34a853; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 16px;">
                إضافة للمنيو (قريباً)
              </button>
            </div>
          </body>
        </html>
      `, { headers: { "Content-Type": "text/html; charset=utf-8" } });
    }

    // 2. الصفحة الرئيسية للمشروع
    return new Response(`
      <html dir="rtl">
        <head><meta charset="UTF-8"></head>
        <body style="font-family: Arial; text-align: center; padding: 100px; background: #ffffff;">
          <h1 style="font-size: 48px; color: #ff4757;">🍽️ منصة المنيو الذكي</h1>
          <p style="font-size: 20px; color: #5f6368;">مشروعك الآن يعمل مباشرة من GitHub عبر Cloudflare!</p>
          <br>
          <a href="/admin" style="text-decoration: none; color: white; background: #1a73e8; padding: 15px 30px; border-radius: 50px; font-weight: bold;">
            دخول لوحة تحكم المطاعم
          </a>
        </body>
      </html>
    `, { headers: { "Content-Type": "text/html; charset=utf-8" } });
  }
};
