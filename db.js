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

  // إحصائيات محسنة (استعلام واحد بدلاً من ثلاثة)
  const statsQuery = await env.DB.prepare(`
    SELECT 
      (SELECT COUNT(*) FROM restaurants) as totalCount,
      (SELECT COUNT(*) FROM restaurants WHERE expires_at >= ?) as activeCount,
      (SELECT COUNT(*) FROM items) as totalItems
  `).bind(today).first();
  const totalCount = statsQuery.totalCount;
  const activeCount = statsQuery.activeCount;
  const expiredCount = totalCount - activeCount;
  const totalItems = statsQuery.totalItems;

  // حل N+1: جلب آخر نشاط لكل المطاعم دفعة واحدة
  if (restaurants.length > 0) {
    const ids = restaurants.map(r => r.id);
    const placeholders = ids.map(() => '?').join(',');
    const { results: lastLogs } = await env.DB.prepare(`
      SELECT restaurant_id, action, timestamp
      FROM activity_logs
      WHERE (restaurant_id, timestamp) IN (
        SELECT restaurant_id, MAX(timestamp)
        FROM activity_logs
        WHERE restaurant_id IN (${placeholders})
        GROUP BY restaurant_id
      )
    `).bind(...ids).all();

    const logMap = {};
    lastLogs.forEach(log => { logMap[log.restaurant_id] = log; });

    for (let res of restaurants) {
      const log = logMap[res.id];
      res.last_activity = log 
        ? { action: log.action, timestamp: log.timestamp }
        : null;
    }
  } else {
    for (let res of restaurants) {
      res.last_activity = null;
    }
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