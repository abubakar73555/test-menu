// ==========================================
// رفع الصور إلى R2
// ==========================================
import { sanitizeFileName } from './utils.js';
import { getRestaurantBySlug } from './db.js';
import { fileTypeFromBuffer } from 'file-type';

export async function handleImageUpload(request, env) {
  if (!env.R2) {
    return new Response(JSON.stringify({ error: "❌ خطأ في الإعدادات: لم يتم ربط مخزن الصور (R2) مع التطبيق." }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }

  const cookie = request.headers.get("Cookie") || "";
  const isMaster = cookie.includes("auth_role=master");
  let restaurantSlug = null;
  const match = cookie.match(/auth_role=res_([^;]+)/);
  if (match) restaurantSlug = match[1];

  if (!isMaster && !restaurantSlug) {
    return new Response(JSON.stringify({ error: "❌ غير مصرح: يجب تسجيل الدخول أولاً." }), {
      status: 401,
      headers: { "Content-Type": "application/json" }
    });
  }

  let formData;
  try {
    formData = await request.formData();
  } catch (e) {
    return new Response(JSON.stringify({ error: "❌ فشل قراءة بيانات النموذج: " + e.message }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }

  let restaurantId;
  try {
    if (isMaster) {
      restaurantId = formData.get("restaurant_id");
      // تأكد من وجود المطعم
      if (restaurantId) {
        const exists = await env.DB.prepare("SELECT id FROM restaurants WHERE id = ?").bind(restaurantId).first();
        if (!exists) {
          return new Response(JSON.stringify({ error: "❌ المطعم غير موجود." }), { status: 404, headers: { "Content-Type": "application/json" } });
        }
      } else {
        return new Response(JSON.stringify({ error: "❌ يجب تحديد معرف المطعم." }), { status: 400, headers: { "Content-Type": "application/json" } });
      }
    } else {
      const res = await getRestaurantBySlug(env, restaurantSlug);
      if (!res) return new Response(JSON.stringify({ error: "❌ المطعم غير موجود." }), { status: 404, headers: { "Content-Type": "application/json" } });
      restaurantId = res.id;
    }
  } catch (dbError) {
    return new Response(JSON.stringify({ error: "❌ خطأ في قاعدة البيانات: " + dbError.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }

  const file = formData.get("image");
  if (!file) {
    return new Response(JSON.stringify({ error: "❌ لم يتم اختيار أي صورة." }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }

  const MAX_SIZE = 2 * 1024 * 1024; // 2 ميجابايت كما طلب المستخدم
  if (file.size > MAX_SIZE) {
    return new Response(JSON.stringify({ error: "❌ حجم الصورة كبير جداً. الحد الأقصى 2 ميجابايت." }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }

  let bytes, buffer;
  try {
    bytes = await file.arrayBuffer();
    buffer = new Uint8Array(bytes);
  } catch (e) {
    return new Response(JSON.stringify({ error: "❌ فشل قراءة محتوى الصورة: " + e.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }

  // فحص المحتوى الفعلي للصورة
  const type = await fileTypeFromBuffer(buffer);
  const allowedMimeTypes = ['image/webp', 'image/jpeg', 'image/png'];
  
  if (!type || !allowedMimeTypes.includes(type.mime)) {
    return new Response(JSON.stringify({ error: "❌ صيغة الملف غير مدعومة. المسموح: WebP, JPG, PNG فقط." }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }

  // استخدام اسم ملف آمن بامتداد .webp دائماً
  const fileName = `res_${restaurantId}_${Date.now()}.webp`;
  const sanitizedName = sanitizeFileName(fileName);

  try {
    await env.R2.put(fileName, buffer, {
      httpMetadata: { contentType: file.type }
    });
  } catch (r2Error) {
    return new Response(JSON.stringify({ error: "❌ فشل رفع الصورة: " + r2Error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }

  // استخدم متغير البيئة للمجال إذا كان موجوداً
  const publicUrl = `https://images.topsafetypro.com/${fileName}`;
  return new Response(JSON.stringify({ url: publicUrl, message: "✅ تم رفع الصورة بنجاح" }), {
    headers: { "Content-Type": "application/json" }
  });
}
