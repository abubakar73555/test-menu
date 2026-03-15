// ==========================================
// utils.js - دوال مساعدة عامة
// ==========================================
import bcrypt from 'bcryptjs';

// تسجيل النشاطات مع تفاصيل إضافية
export async function logActivity(env, restaurantId, action, details, request = null) {
  let ip = null;
  let userAgent = null;
  if (request) {
    ip = request.headers.get('CF-Connecting-IP') || request.headers.get('X-Forwarded-For');
    userAgent = request.headers.get('User-Agent');
  }
  await env.DB.prepare(
    "INSERT INTO activity_logs (restaurant_id, action, details, ip, user_agent, timestamp) VALUES (?, ?, ?, ?, ?, ?)"
  ).bind(restaurantId, action, details, ip, userAgent, new Date().toISOString()).run();
}

// دالة مساعدة لتنسيق التاريخ في المتصفح (تُستخدم في القوالب)
export function formatDateForDisplay(isoString) {
  if (!isoString) return '';
  const d = new Date(isoString);
  return d.toLocaleString('ar-EG', {
    year: 'numeric', month: 'numeric', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

// تنظيف اسم الملف للرفع
export function sanitizeFileName(fileName) {
  return fileName.replace(/[^a-zA-Z0-9.]/g, '_');
}

// إنشاء slug آمن (مع دعم العربية)
export function safeUrl(text) {
  return text
    .replace(/[^\w\s\u0600-\u06FF-]/g, '') // يسمح بالعربية
    .replace(/\s+/g, '-')
    .toLowerCase();
}

// تشفير كلمة المرور
export async function hashPassword(password) {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
}

// مقارنة كلمة المرور مع الهاش
export async function comparePassword(password, hash) {
  return await bcrypt.compare(password, hash);
}