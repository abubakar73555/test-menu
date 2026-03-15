// ==========================================
// الملف الرئيسي - التوجيه فقط
// ==========================================
import { handleLoginRoute, handleLoginSubmit } from './auth.js';
import { handleMasterRoute } from './master.js';
import { handleCategoriesRoute, handleRestaurantRoute, handleSettingsRoute, handleItemOptionsRoute } from './restaurant.js';
import { handlePublicMenuRoute, handleAboutRoute, handleOptionsAPI } from './menu.js';
import { handleImageUpload } from './upload.js';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const pathname = url.pathname;
    const parts = pathname.split('/').filter(Boolean);

    try {
      // الصفحة الرئيسية (تسجيل الدخول)
      if (pathname === "/" || pathname === "") return handleLoginRoute(request, env);

      // معالجة POST لتسجيل الدخول
      if (pathname === "/login" && request.method === "POST") return handleLoginSubmit(request, env);

      // لوحة الماستر
      if (parts[0] === "admin" && parts[1] === "master") return handleMasterRoute(request, env);

      // إدارة الفئات
      if (parts[0] === "admin" && parts[1] && parts[2] === "categories") 
        return handleCategoriesRoute(request, env, parts[1]);

      // إعدادات المطعم
      if (parts[0] === "admin" && parts[1] && parts[2] === "settings") 
        return handleSettingsRoute(request, env, parts[1]);

      // إدارة خيارات الوجبات
      if (parts[0] === "admin" && parts[1] && parts[2] === "item-options" && parts[3]) 
        return handleItemOptionsRoute(request, env, parts[1], parts[3]);

      // لوحة تحكم المطعم
      if (parts[0] === "admin" && parts[1]) 
        return handleRestaurantRoute(request, env, parts[1], url.origin);

      // صفحة "عن المطعم"
      if (parts[0] === "about" && parts[1]) 
        return handleAboutRoute(env, parts[1]);

      // صفحة المنيو العام
      if (parts[0] === "menu" && parts[1]) 
        return handlePublicMenuRoute(env, parts[1], url);

      // رفع الصور
      if (parts[0] === "upload" && parts[1] === "image") 
        return handleImageUpload(request, env);

      // API لجلب خيارات الوجبات
      if (parts[0] === "api" && parts[1] === "options" && parts[2]) 
        return handleOptionsAPI(env, parts[2]);

      return new Response("404 Not Found", { status: 404 });
    } catch (e) {
      return new Response(JSON.stringify({ error: e.message, stack: e.stack }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }
  }
};