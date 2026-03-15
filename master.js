// ==========================================
// لوحة تحكم الماستر
// ==========================================
import { logActivity, safeUrl, hashPassword } from './utils.js';
import { getFilteredRestaurants } from './db.js';
import { renderMasterHTML } from './templates/master.js';

export async function handleMasterRoute(request, env) {
  const cookie = request.headers.get("Cookie") || "";
  if (!cookie.includes("auth_role=master")) 
    return Response.redirect(new URL("/", request.url));

  const url = new URL(request.url);
  const searchParams = url.searchParams;

  if (request.method === "POST") {
    const data = await request.formData();
    const action = data.get("action");

    if (action === "add") {
      const slug = safeUrl(data.get("slug"));
      const existing = await env.DB.prepare("SELECT id FROM restaurants WHERE slug = ?").bind(slug).first();
      if (existing) {
        const { restaurants, ...stats } = await getFilteredRestaurants(env, url);
        return new Response(renderMasterHTML(restaurants, stats, searchParams, "❌ Slug موجود مسبقاً"), { 
          headers: { "Content-Type": "text/html; charset=utf-8" } 
        });
      }
      // تشفير كلمة المرور
      const hashedPassword = await hashPassword(data.get("pass"));
      await env.DB.prepare(
        "INSERT INTO restaurants (res_name, slug, admin_password, created_at, expires_at) VALUES (?, ?, ?, ?, ?)"
      ).bind(data.get("res_name"), slug, hashedPassword, data.get("created"), data.get("expires")).run();

      const newRes = await env.DB.prepare("SELECT id FROM restaurants WHERE slug = ?").bind(slug).first();
      await env.DB.prepare(
        "INSERT INTO restaurant_settings (restaurant_id, theme_name) VALUES (?, ?)"
      ).bind(newRes.id, 'default').run();

      await logActivity(env, null, "master_add_restaurant", `أضاف مطعم ${data.get("res_name")}`, request);

    } else if (action === "edit") {
      const id = data.get("id");
      const pass = data.get("pass");
      // إذا تم تغيير كلمة المرور، نقوم بتشفيرها
      let updateQuery = "UPDATE restaurants SET res_name = ?, slug = ?, expires_at = ?";
      let params = [data.get("res_name"), data.get("slug"), data.get("expires")];
      if (pass && pass.trim() !== '') {
        const hashedPassword = await hashPassword(pass);
        updateQuery += ", admin_password = ?";
        params.push(hashedPassword);
      }
      updateQuery += " WHERE id = ?";
      params.push(id);
      await env.DB.prepare(updateQuery).bind(...params).run();
      await logActivity(env, id, "master_edit_restaurant", `عدل بيانات المطعم ${data.get("res_name")}`, request);

    } else if (action === "delete") {
      const id = data.get("id");
      await env.DB.prepare("DELETE FROM restaurants WHERE id = ?").bind(id).run();
      await logActivity(env, null, "master_delete_restaurant", `حذف مطعم ID: ${id}`, request);
    }

    return Response.redirect(new URL("/admin/master", request.url));
  }

  const { restaurants, ...stats } = await getFilteredRestaurants(env, url);
  return new Response(renderMasterHTML(restaurants, stats, searchParams), { 
    headers: { "Content-Type": "text/html; charset=utf-8" } 
  });
}