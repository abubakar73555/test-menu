export default {
  async fetch(request, env, ctx) {
    const html = `
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>اختبار الربط مع GitHub</title>
        <style>
            body { font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background-color: #f4f4f9; }
            .card { background: white; padding: 2rem; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); text-align: center; }
            h1 { color: #0547ed; }
            p { color: #666; }
            .status { color: green; font-weight: bold; }
        </style>
    </head>
    <body>
        <div class="card">
            <h1>🚀 تم الربط بنجاح!</h1>
            <p>هذا الكود يعمل الآن مباشرة من مستودع <strong>GitHub</strong>.</p>
            <p>وقت التحديث الأخير: ${new Date().toLocaleTimeString('ar-SA')}</p>
            <div class="status">الحالة: متصل عبر Cloudflare Workers</div>
        </div>
    </body>
    </html>
    `;

    return new Response(html, {
      headers: { "content-type": "text/html;charset=UTF-8" },
    });
  },
};
