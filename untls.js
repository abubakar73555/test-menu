// ==========================================
// دوال مساعدة عامة
// ==========================================


// تسجيل النشاطات
export async function logActivity(env, restaurantId, action, details) {
  await env.DB.prepare(
    "INSERT INTO activity_logs (restaurant_id, action, timestamp) VALUES (?, ?, ?)"
  ).bind(restaurantId, `${action}: ${details}`, new Date().toISOString()).run();
}

// تنسيق التاريخ للعرض
export function formatDate(date) {
  return new Date(date).toLocaleString('ar-EG');
}

// تنظيف اسم الملف للرفع
export function sanitizeFileName(fileName) {
  return fileName.replace(/[^a-zA-Z0-9.]/g, '_');
}

// إنشاء رابط آمن
export function safeUrl(text) {
  return text.replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').toLowerCase();
}