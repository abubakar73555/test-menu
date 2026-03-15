// ==========================================
// menu.js - صفحة المنيو العام وصفحة عن المطعم
// ==========================================
import { getRestaurantBySlug, getRestaurantSettings, getRestaurantInfo } from './db.js';
import { renderPublicMenuHTML, renderAboutHTML } from './templates/menu.js';

// ==========================================
// صفحة المنيو العام
// ==========================================
export async function handlePublicMenuRoute(env, slug, url) {
  const res = await getRestaurantBySlug(env, slug);
  if (!res) return new Response("المطعم غير موجود", { status: 404 });

  const info = await getRestaurantInfo(env, res.id);
  const settings = await getRestaurantSettings(env, res.id);
  const tableId = url.searchParams.get("table") || null;

  // جلب اسم الطاولة إذا كان tableId موجوداً
  let tableName = null;
  if (tableId) {
    const table = await env.DB.prepare("SELECT table_name FROM tables WHERE id = ? AND restaurant_id = ?").bind(tableId, res.id).first();
    tableName = table ? table.table_name : `طاولة ${tableId}`;
  }

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

  return new Response(renderPublicMenuHTML(res, categories, uncategorized, settings, tableName, info), {
    headers: { "Content-Type": "text/html; charset=utf-8" }
  });
}

// ==========================================
// صفحة "عن المطعم"
// ==========================================
export async function handleAboutRoute(env, slug) {
  try {
    const res = await getRestaurantBySlug(env, slug);
    if (!res) return new Response("المطعم غير موجود", { status: 404 });

    const info = await getRestaurantInfo(env, res.id);
    const settings = await getRestaurantSettings(env, res.id);

    return new Response(renderAboutHTML(res, info, settings), {
      headers: { "Content-Type": "text/html; charset=utf-8" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message, stack: err.stack }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
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