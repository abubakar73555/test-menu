// ==========================================
// صفحات تسجيل الدخول
// ==========================================
import { logActivity } from './utils.js';
import { getRestaurantBySlug } from './db.js';

export async function handleLoginRoute(request, env) {
  const MASTER_PASSWORD = env.MASTER_PASSWORD || "admin123";

  if (request.method === "POST") {
    const data = await request.formData();
    const user = data.get("user").toLowerCase().trim();
    const pass = data.get("pass").trim();

    if (user === "master" && pass === MASTER_PASSWORD) {
      return new Response(null, { 
        status: 302, 
        headers: { 
          "Location": "/admin/master", 
          "Set-Cookie": "auth_role=master; Path=/; HttpOnly" 
        } 
      });
    }

    const res = await getRestaurantBySlug(env, user);
    if (res && res.admin_password === pass) {
      await logActivity(env, res.id, "restaurant_login", `دخول إلى لوحة التحكم`);
      return new Response(null, { 
        status: 302, 
        headers: { 
          "Location": `/admin/${user}`, 
          "Set-Cookie": `auth_role=res_${user}; Path=/; HttpOnly` 
        } 
      });
    }

    return new Response(renderLoginHTML("❌ بيانات خاطئة"), { 
      headers: { "Content-Type": "text/html; charset=utf-8" } 
    });
  }
  return new Response(renderLoginHTML(), { 
    headers: { "Content-Type": "text/html; charset=utf-8" } 
  });
}

function renderLoginHTML(err = "") {
  return `<!DOCTYPE html>
<html dir="rtl">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>تسجيل الدخول</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Tahoma, Arial, sans-serif; background: #f4f7f6; display: flex; justify-content: center; align-items: center; min-height: 100vh; padding: 20px; }
  .card { background: white; padding: 30px 25px; border-radius: 15px; box-shadow: 0 5px 15px rgba(0,0,0,0.1); width: 100%; max-width: 350px; text-align: center; }
  h2 { margin-bottom: 20px; color: #333; }
  input, button { width: 100%; margin: 10px 0; padding: 12px; border: 1px solid #ddd; border-radius: 8px; font-size: 16px; }
  button { background: #007bff; color: white; border: none; cursor: pointer; font-weight: bold; }
  .error { color: red; margin-bottom: 15px; }
</style>
</head>
<body>
  <div class="card">
    <h2>🔐 تسجيل الدخول</h2>
    <p class="error">${err}</p>
    <form method="POST">
      <input name="user" placeholder="اليوزر أو السلج" required>
      <input type="password" name="pass" placeholder="كلمة المرور" required>
      <button type="submit">دخول</button>
    </form>
  </div>
</body>
</html>`;
}