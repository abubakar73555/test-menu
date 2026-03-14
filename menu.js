// ==========================================
// menu.js - صفحة المنيو العام وصفحة عن المطعم
// ==========================================
import { getRestaurantBySlug, getRestaurantSettings, getRestaurantInfo } from './db.js';

// ==========================================
// صفحة المنيو العام
// ==========================================
export async function handlePublicMenuRoute(env, slug, url) {
  const res = await getRestaurantBySlug(env, slug);
  if (!res) return new Response("المطعم غير موجود", { status: 404 });

  const info = await getRestaurantInfo(env, res.id);
  const settings = await getRestaurantSettings(env, res.id);
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

// ==========================================
// صفحة "عن المطعم"
// ==========================================
export async function handleAboutRoute(env, slug) {
  const res = await getRestaurantBySlug(env, slug);
  if (!res) return new Response("المطعم غير موجود", { status: 404 });

  const info = await getRestaurantInfo(env, res.id);
  const settings = await getRestaurantSettings(env, res.id);

  return new Response(renderAboutHTML(res, info, settings), {
    headers: { "Content-Type": "text/html; charset=utf-8" }
  });
}

// ==========================================
// API لجلب خيارات الوجبة
// ==========================================
export async function handleOptionsAPI(env, itemId) {
  try {
    const { results: options } = await env.DB.prepare(
      "SELECT id, option_name, option_price FROM item_options WHERE item_id = ? ORDER BY option_name"
    ).bind(itemId).all();
    
    return new Response(JSON.stringify(options || []), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}

// ==========================================
// دوال عرض HTML
// ==========================================
function renderPublicMenuHTML(res, categories, uncategorized, settings, table, info) {
  // (هنا ضع الكود الذي أرسلته سابقًا بالكامل)
  // نظرًا لطول الكود، أشرت إليه فقط. تأكد من لصق الكود الذي لديك هنا.
  // أنا أستخدم الكود الذي أرسلته في رسالتك السابقة، وسأضعه هنا مختصرًا للإشارة.
  return `...`; // ضع الكود الكامل مكان هذه النقاط
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