// ==========================================
// restaurant.js - إدارة المطعم والفئات والإعدادات وخيارات الأطباق
// ==========================================
import { logActivity, safeUrl, hashPassword } from './utils.js';
import { getRestaurantBySlug, getRestaurantSettings, getRestaurantInfo } from './db.js';
import { renderRestaurantHTML } from './templates/restaurant.js';
import { renderCategoriesHTML } from './templates/categories.js';
import { renderSettingsHTML } from './templates/settings.js';
import { renderItemOptionsHTML } from './templates/itemoptions.js'; 

// ==========================================
// 1. لوحة تحكم المطعم (الوجبات)
// ==========================================
export async function handleRestaurantRoute(request, env, slug, origin) {
  try {
    const cookie = request.headers.get("Cookie") || "";
    const isMaster = cookie.includes("auth_role=master");
    const isOwner = cookie.includes(`auth_role=res_${slug}`);
    if (!isMaster && !isOwner) return Response.redirect(new URL("/", request.url));

    const res = await getRestaurantBySlug(env, slug);
    if (!res) return new Response("المطعم غير موجود", { status: 404 });

    const { results: categories } = await env.DB.prepare(
      "SELECT * FROM categories WHERE restaurant_id = ? ORDER BY sort_order, name"
    ).bind(res.id).all();

    const info = await getRestaurantInfo(env, res.id);

    // ========== معالجة إجراءات الطاولات والوجبات ==========
    if (request.method === "POST") {
      const data = await request.formData();
      const action = data.get("action");

      // إجراءات الوجبات
      if (action === "add") {
        const name = data.get("name");
        const price = data.get("price");
        const categoryId = data.get("category_id") || null;
        const imageUrl = data.get("image_url") || null;
        const featured = data.get("featured") ? 1 : 0;

        await env.DB.prepare(
          "INSERT INTO items (restaurant_id, name, price, category_id, image_url, featured) VALUES (?, ?, ?, ?, ?, ?)"
        ).bind(res.id, name, price, categoryId, imageUrl, featured).run();
        await logActivity(env, res.id, "item_add", `أضاف وجبة ${name}`, request);
        return Response.redirect(new URL(`/admin/${slug}?success=` + encodeURIComponent("تم إضافة الوجبة"), request.url));

      } else if (action === "edit") {
        const itemId = data.get("id");
        const name = data.get("name");
        const price = data.get("price");
        const categoryId = data.get("category_id");
        const imageUrl = data.get("image_url");
        const featured = data.get("featured") ? 1 : 0;

        await env.DB.prepare(
          "UPDATE items SET name = ?, price = ?, category_id = ?, image_url = ?, featured = ? WHERE id = ?"
        ).bind(name, price, categoryId, imageUrl, featured, itemId).run();
        await logActivity(env, res.id, "item_edit", `عدل وجبة ${name}`, request);
        return Response.redirect(new URL(`/admin/${slug}?success=` + encodeURIComponent("تم تحديث الوجبة"), request.url));

      } else if (action === "delete") {
        const itemId = data.get("id");
        await env.DB.prepare("DELETE FROM items WHERE id = ?").bind(itemId).run();
        await logActivity(env, res.id, "item_delete", `حذف وجبة ID: ${itemId}`, request);
        return Response.redirect(new URL(`/admin/${slug}?success=` + encodeURIComponent("تم حذف الوجبة"), request.url));
      }

      // إجراءات الطاولات
      else if (action === "add_table") {
        const tableName = data.get("table_name");
        await env.DB.prepare(
          "INSERT INTO tables (restaurant_id, table_name) VALUES (?, ?)"
        ).bind(res.id, tableName).run();
        await logActivity(env, res.id, "table_add", `أضاف طاولة ${tableName}`, request);
        return Response.redirect(new URL(`/admin/${slug}?success=` + encodeURIComponent("تم إضافة الطاولة"), request.url));

      } else if (action === "edit_table") {
        const tableId = data.get("table_id");
        const tableName = data.get("table_name");
        await env.DB.prepare(
          "UPDATE tables SET table_name = ? WHERE id = ? AND restaurant_id = ?"
        ).bind(tableName, tableId, res.id).run();
        await logActivity(env, res.id, "table_edit", `عدل اسم طاولة إلى ${tableName}`, request);
        return Response.redirect(new URL(`/admin/${slug}?success=` + encodeURIComponent("تم تحديث اسم الطاولة"), request.url));

      } else if (action === "delete_table") {
        const tableId = data.get("table_id");
        await env.DB.prepare(
          "DELETE FROM tables WHERE id = ? AND restaurant_id = ?"
        ).bind(tableId, res.id).run();
        await logActivity(env, res.id, "table_delete", `حذف طاولة`, request);
        return Response.redirect(new URL(`/admin/${slug}?success=` + encodeURIComponent("تم حذف الطاولة"), request.url));
      }

      return Response.redirect(new URL(`/admin/${slug}`, request.url));
    }

    // جلب الوجبات
    const { results: items } = await env.DB.prepare(`
      SELECT items.*, categories.name as category_name 
      FROM items 
      LEFT JOIN categories ON items.category_id = categories.id 
      WHERE items.restaurant_id = ?
      ORDER BY items.featured DESC, categories.sort_order, categories.name, items.name
    `).bind(res.id).all();

    // جلب الطاولات من قاعدة البيانات
    const { results: tables } = await env.DB.prepare(
      "SELECT * FROM tables WHERE restaurant_id = ? ORDER BY id"
    ).bind(res.id).all();

    const settings = await getRestaurantSettings(env, res.id);

    // التأكد من وجود القيم الأساسية لمنع الأخطاء في القالب
    const safeRes = res || {};
    const safeItems = items || [];
    const safeCategories = categories || [];
    const safeSettings = settings || {};
    const safeInfo = info || {};
    const safeTables = tables || [];

    // محاولة عرض القالب مع معالجة الأخطاء
    let html;
    try {
      html = renderRestaurantHTML(safeRes, safeItems, safeCategories, safeSettings, origin, safeInfo, safeTables);
    } catch (renderError) {
      console.error("خطأ في renderRestaurantHTML:", renderError);
      return new Response(`<h1>خطأ في عرض الصفحة</h1><pre>${renderError.message}</pre>`, {
        status: 500,
        headers: { "Content-Type": "text/html; charset=utf-8" }
      });
    }

    return new Response(html, {
      headers: { 
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        "Pragma": "no-cache",
        "Expires": "0",
        "Surrogate-Control": "no-store"
      }
    });
  } catch (error) {
    console.error("خطأ في handleRestaurantRoute:", error);
    return new Response(`<h1>حدث خطأ غير متوقع</h1><pre>${error.message}</pre>`, {
      status: 500,
      headers: { "Content-Type": "text/html; charset=utf-8" }
    });
  }
}

// ==========================================
// 2. إدارة الفئات
// ==========================================
export async function handleCategoriesRoute(request, env, slug) {
  try {
    const cookie = request.headers.get("Cookie") || "";
    const isMaster = cookie.includes("auth_role=master");
    const isOwner = cookie.includes(`auth_role=res_${slug}`);
    if (!isMaster && !isOwner) return Response.redirect(new URL("/", request.url));

    const res = await getRestaurantBySlug(env, slug);
    if (!res) return new Response("المطعم غير موجود", { status: 404 });

    if (request.method === "POST") {
      const data = await request.formData();
      const action = data.get("action");

      if (action === "add") {
        const name = data.get("name");
        await env.DB.prepare(
          "INSERT INTO categories (restaurant_id, name, sort_order) VALUES (?, ?, ?)"
        ).bind(res.id, name, 0).run();
        await logActivity(env, res.id, "category_add", `أضاف فئة ${name}`, request);
        return Response.redirect(new URL(`/admin/${slug}/categories?success=` + encodeURIComponent("تم إضافة الفئة"), request.url));
      } else if (action === "delete") {
        const catId = data.get("id");
        await env.DB.prepare("DELETE FROM categories WHERE id = ?").bind(catId).run();
        await logActivity(env, res.id, "category_delete", `حذف فئة ID: ${catId}`, request);
        return Response.redirect(new URL(`/admin/${slug}/categories?success=` + encodeURIComponent("تم حذف الفئة"), request.url));
      } else if (action === "edit") {
        const catId = data.get("id");
        const name = data.get("name");
        await env.DB.prepare("UPDATE categories SET name = ? WHERE id = ?").bind(name, catId).run();
        await logActivity(env, res.id, "category_edit", `عدل فئة إلى ${name}`, request);
        return Response.redirect(new URL(`/admin/${slug}/categories?success=` + encodeURIComponent("تم تحديث الفئة"), request.url));
      }

      return Response.redirect(new URL(`/admin/${slug}/categories`, request.url));
    }

    const { results: categories } = await env.DB.prepare(
      "SELECT * FROM categories WHERE restaurant_id = ? ORDER BY sort_order, name"
    ).bind(res.id).all();

    return new Response(renderCategoriesHTML(res, categories || []), {
      headers: { "Content-Type": "text/html; charset=utf-8" }
    });
  } catch (error) {
    console.error("خطأ في handleCategoriesRoute:", error);
    return new Response(`<h1>حدث خطأ</h1><pre>${error.message}</pre>`, { status: 500, headers: { "Content-Type": "text/html" } });
  }
}

// ==========================================
// 3. إعدادات المطعم (المظهر ومعلومات المطعم)
// ==========================================
export async function handleSettingsRoute(request, env, slug) {
  try {
    const cookie = request.headers.get("Cookie") || "";
    const isMaster = cookie.includes("auth_role=master");
    const isOwner = cookie.includes(`auth_role=res_${slug}`);
    if (!isMaster && !isOwner) return Response.redirect(new URL("/", request.url));

    const res = await getRestaurantBySlug(env, slug);
    if (!res) return new Response("المطعم غير موجود", { status: 404 });

    let info = await env.DB.prepare("SELECT * FROM restaurant_info WHERE restaurant_id = ?").bind(res.id).first();
    if (!info) {
      info = { phone: '', whatsapp: '', address: '', map_url: '', working_hours: '', facebook: '', instagram: '', number_of_tables: 5 };
    }

    if (request.method === "POST") {
      const data = await request.formData();
      const theme = data.get("theme");
      const primary = data.get("primary_color");
      const secondary = data.get("secondary_color");
      const font = data.get("font_family");
      const logoUrl = data.get("logo_url");

      await env.DB.prepare(`
        INSERT INTO restaurant_settings (restaurant_id, theme_name, primary_color, secondary_color, font_family, logo_url)
        VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(restaurant_id) DO UPDATE SET
          theme_name=excluded.theme_name,
          primary_color=excluded.primary_color,
          secondary_color=excluded.secondary_color,
          font_family=excluded.font_family,
          logo_url=excluded.logo_url
      `).bind(res.id, theme, primary, secondary, font, logoUrl).run();

      const phone = data.get("phone") || '';
      const whatsapp = data.get("whatsapp") || '';
      const address = data.get("address") || '';
      const map_url = data.get("map_url") || '';
      const working_hours = data.get("working_hours") || '';
      const facebook = data.get("facebook") || '';
      const instagram = data.get("instagram") || '';
      const number_of_tables = parseInt(data.get("number_of_tables")) || 5;

      await env.DB.prepare(`
        INSERT INTO restaurant_info (restaurant_id, phone, whatsapp, address, map_url, working_hours, facebook, instagram, number_of_tables)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(restaurant_id) DO UPDATE SET
          phone=excluded.phone,
          whatsapp=excluded.whatsapp,
          address=excluded.address,
          map_url=excluded.map_url,
          working_hours=excluded.working_hours,
          facebook=excluded.facebook,
          instagram=excluded.instagram,
          number_of_tables=excluded.number_of_tables
      `).bind(res.id, phone, whatsapp, address, map_url, working_hours, facebook, instagram, number_of_tables).run();

      await logActivity(env, res.id, "settings_update", `حدث الإعدادات`, request);
      return Response.redirect(new URL(`/admin/${slug}/settings?success=` + encodeURIComponent("تم حفظ الإعدادات بنجاح"), request.url));
    }

    const settings = await getRestaurantSettings(env, res.id);

    return new Response(renderSettingsHTML(res, settings, info), {
      headers: { "Content-Type": "text/html; charset=utf-8" }
    });
  } catch (error) {
    console.error("خطأ في handleSettingsRoute:", error);
    return new Response(`<h1>حدث خطأ</h1><pre>${error.message}</pre>`, { status: 500, headers: { "Content-Type": "text/html" } });
  }
}

// ==========================================
// 4. إدارة خيارات الأطباق
// ==========================================
export async function handleItemOptionsRoute(request, env, slug, itemId) {
  try {
    const cookie = request.headers.get("Cookie") || "";
    const isMaster = cookie.includes("auth_role=master");
    const isOwner = cookie.includes(`auth_role=res_${slug}`);
    if (!isMaster && !isOwner) return Response.redirect(new URL("/", request.url));

    const res = await getRestaurantBySlug(env, slug);
    if (!res) return new Response("المطعم غير موجود", { status: 404 });

    const item = await env.DB.prepare("SELECT * FROM items WHERE id = ? AND restaurant_id = ?").bind(itemId, res.id).first();
    if (!item) return new Response("الوجبة غير موجودة", { status: 404 });

    if (request.method === "POST") {
      const data = await request.formData();
      const action = data.get("action");

      if (action === "add") {
        const optionName = data.get("option_name");
        const optionPrice = parseFloat(data.get("option_price")) || 0;
        await env.DB.prepare(
          "INSERT INTO item_options (item_id, option_name, option_price) VALUES (?, ?, ?)"
        ).bind(itemId, optionName, optionPrice).run();
        await logActivity(env, res.id, "option_add", `أضاف خيار ${optionName} لوجبة ${item.name}`, request);
        return Response.redirect(new URL(`/admin/${slug}/item-options/${itemId}?success=` + encodeURIComponent("تم إضافة الخيار بنجاح"), request.url));
      } else if (action === "delete") {
        const optionId = data.get("option_id");
        await env.DB.prepare("DELETE FROM item_options WHERE id = ?").bind(optionId).run();
        await logActivity(env, res.id, "option_delete", `حذف خيار من وجبة ${item.name}`, request);
        return Response.redirect(new URL(`/admin/${slug}/item-options/${itemId}?success=` + encodeURIComponent("تم حذف الخيار"), request.url));
      }

      return Response.redirect(new URL(`/admin/${slug}/item-options/${itemId}`, request.url));
    }

    const { results: options } = await env.DB.prepare(
      "SELECT * FROM item_options WHERE item_id = ? ORDER BY option_name"
    ).bind(itemId).all();

    // تم تعديل اسم الدالة هنا ليتوافق مع الـ Import في الأعلى
    return new Response(renderItemOptionsHTML(res, item, options || []), {
      headers: { "Content-Type": "text/html; charset=utf-8" }
    });
  } catch (error) {
    console.error("خطأ في handleItemOptionsRoute:", error);
    return new Response(`<h1>حدث خطأ</h1><pre>${error.message}</pre>`, { status: 500, headers: { "Content-Type": "text/html" } });
  }
}
