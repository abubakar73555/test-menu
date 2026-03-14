// ==========================================
// دوال قاعدة البيانات المساعدة
// ==========================================
import { logActivity } from './utils.js';

// جلب المطاعم مع فلترة
export async function getFilteredRestaurants(env, url) {
  const search = url.searchParams.get("search") || "";
  const status = url.searchParams.get("status") || "all";
  const today = new Date().toISOString().split('T')[0];

  let query = "SELECT * FROM restaurants WHERE 1=1";
  const params = [];

  if (search) {
    query += " AND (res_name LIKE ? OR slug LIKE ?)";
    params.push(`%${search}%`, `%${search}%`);
  }
  if (status === "active") {
    query += " AND expires_at >= ?";
    params.push(today);
  } else if (status === "expired") {
    query += " AND expires_at < ?";
    params.push(today);
  }
  query += " ORDER BY created_at DESC";

  const { results: restaurants } = await env.DB.prepare(query).bind(...params).all();

  // إحصائيات
  const totalCount = (await env.DB.prepare("SELECT COUNT(*) as count FROM restaurants").first()).count;
  const activeCount = (await env.DB.prepare("SELECT COUNT(*) as count FROM restaurants WHERE expires_at >= ?").bind(today).first()).count;
  const expiredCount = totalCount - activeCount;
  const totalItems = (await env.DB.prepare("SELECT COUNT(*) as count FROM items").first()).count;

  // آخر نشاط
  for (let res of restaurants) {
    const lastLog = await env.DB.prepare(
      "SELECT action, timestamp FROM activity_logs WHERE restaurant_id = ? ORDER BY timestamp DESC LIMIT 1"
    ).bind(res.id).first();
    res.last_activity = lastLog 
      ? `${lastLog.action} في ${new Date(lastLog.timestamp).toLocaleString('ar-EG')}` 
      : "لا يوجد نشاط";
  }

  return { restaurants, totalCount, activeCount, expiredCount, totalItems };
}

// جلب معلومات مطعم بواسطة slug
export async function getRestaurantBySlug(env, slug) {
  return await env.DB.prepare("SELECT * FROM restaurants WHERE slug = ?").bind(slug).first();
}

// جلب إعدادات مطعم
export async function getRestaurantSettings(env, restaurantId) {
  const settings = await env.DB.prepare(
    "SELECT * FROM restaurant_settings WHERE restaurant_id = ?"
  ).bind(restaurantId).first();
  return settings || { 
    theme_name: 'default', 
    primary_color: '#007bff', 
    secondary_color: '#6c757d', 
    font_family: 'Tahoma', 
    logo_url: '' 
  };
}

// جلب معلومات إضافية للمطعم
export async function getRestaurantInfo(env, restaurantId) {
  const info = await env.DB.prepare("SELECT * FROM restaurant_info WHERE restaurant_id = ?").bind(restaurantId).first();
  return info || { 
    phone: '', 
    whatsapp: '', 
    address: '', 
    map_url: '', 
    working_hours: '', 
    facebook: '', 
    instagram: '', 
    number_of_tables: 5 
  };
}