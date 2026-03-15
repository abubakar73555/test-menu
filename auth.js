// ==========================================
// auth.js - تسجيل الدخول للماستر والمطاعم
// ==========================================
import { comparePassword } from './utils.js';
import { getRestaurantBySlug } from './db.js';

// عرض صفحة تسجيل الدخول مع رسالة الخطأ
export function handleLoginRoute(request, env) {
  const url = new URL(request.url);
  const errorMsg = url.searchParams.get('error') || '';

  const html = `<!DOCTYPE html>
<html dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>تسجيل الدخول</title>
  <style>
    body { font-family: Tahoma, Arial; background: #f4f7f6; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
    .login-box { background: white; padding: 30px; border-radius: 10px; box-shadow: 0 5px 15px rgba(0,0,0,0.1); width: 350px; max-width: 90%; }
    h2 { text-align: center; color: #333; margin-bottom: 20px; }
    input { width: 100%; padding: 12px; margin: 10px 0; border: 1px solid #ddd; border-radius: 5px; box-sizing: border-box; }
    button { width: 100%; padding: 12px; background: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 1rem; }
    button:hover { background: #0056b3; }
    .error { color: red; text-align: center; margin-top: 10px; padding: 10px; background: #ffeeee; border-radius: 5px; }
  </style>
</head>
<body>
  <div class="login-box">
    <h2>🔑 تسجيل الدخول</h2>
    ${errorMsg ? `<div class="error">${errorMsg}</div>` : ''}
    <form method="POST" action="/login">
      <input type="text" name="username" placeholder="اسم المستخدم (أو slug)" required>
      <input type="password" name="password" placeholder="كلمة المرور" required>
      <button type="submit">دخول</button>
    </form>
  </div>
</body>
</html>`;
  return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}

// معالجة تقديم نموذج تسجيل الدخول
export async function handleLoginSubmit(request, env) {
  try {
    const formData = await request.formData();
    const username = formData.get('username');
    const password = formData.get('password');
    const url = new URL(request.url);
    const origin = url.origin;

    // التحقق من الماستر
    // في بيئة التطوير، استخدم القيمة الافتراضية "admin123" إذا لم يتم تعيين MASTER_PASSWORD
    const masterPassword = env.MASTER_PASSWORD || 'admin123';
    if (username === 'master' && password === masterPassword) {
      return new Response('', {
        status: 302,
        headers: {
          'Location': `${origin}/admin/master`,
          'Set-Cookie': 'auth_role=master; Path=/; HttpOnly; SameSite=Strict'
        }
      });
    }

    // التحقق من مطعم
    const restaurant = await getRestaurantBySlug(env, username);
    if (!restaurant) {
      return Response.redirect(`${origin}/?error=المطعم غير موجود`, 302);
    }

    const isValid = await comparePassword(password, restaurant.admin_password);
    if (isValid) {
      return new Response('', {
        status: 302,
        headers: {
          'Location': `${origin}/admin/${restaurant.slug}`,
          'Set-Cookie': `auth_role=res_${restaurant.slug}; Path=/; HttpOnly; SameSite=Strict`
        }
      });
    } else {
      return Response.redirect(`${origin}/?error=كلمة المرور غير صحيحة`, 302);
    }
  } catch (e) {
    return new Response(e.message, { status: 500 });
  }
}