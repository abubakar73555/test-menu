// ==========================================
// قالب إدارة خيارات الأطباق
// ==========================================

// تم تعديل اسم الدالة إلى حروف صغيرة (renderitemoptionsHTML) 
// ليتطابق تماماً مع الاستدعاء في ملف restaurant.js
export function renderitemoptionsHTML(res, item, options) {
  const rows = (options && options.length > 0) ? options.map(o => `
    <tr>
      <td>${o.option_name}</td>
      <td>${o.option_price > 0 ? o.option_price + ' ريال' : 'مجاني'}</td>
      <td>
        <form method="POST" style="display:inline;" onsubmit="return confirm('حذف هذا الخيار؟');">
          <input type="hidden" name="action" value="delete">
          <input type="hidden" name="option_id" value="${o.id}">
          <button style="background:red; color:white; border:none; padding:5px 10px; border-radius:3px; cursor:pointer;">حذف</button>
        </form>
      </td>
    </tr>
  `).join('') : '<tr><td colspan="3" style="text-align:center;">لا توجد خيارات لهذه الوجبة</td></tr>';

  return `<!DOCTYPE html>
<html dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>خيارات ${item.name} - ${res.res_name}</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: 'Tahoma', Arial, sans-serif; background: #f4f7f6; padding: 15px; margin:0; }
    .container { max-width: 600px; margin: auto; background: white; padding: 20px; border-radius: 10px; box-shadow:0 2px 10px rgba(0,0,0,0.1); }
    h2 { text-align: center; color: #333; margin-bottom: 20px; }
    .add-form { display: flex; gap: 10px; margin-bottom: 20px; flex-wrap: wrap; background: #f9f9f9; padding: 15px; border-radius: 8px; }
    .add-form input, .add-form button { padding: 10px; border: 1px solid #ddd; border-radius: 5px; font-size: 1rem; }
    .add-form input[type="text"] { flex: 2; min-width: 200px; }
    .add-form input[type="number"] { flex: 1; min-width: 100px; }
    .add-form button { background: #28a745; color: white; border: none; cursor: pointer; }
    table { width: 100%; border-collapse: collapse; margin-top: 15px; }
    th { background: #f0f0f0; padding: 10px; text-align: right; }
    td { padding: 10px; border-bottom: 1px solid #eee; }
    .btn-back { display: inline-block; margin-top: 20px; padding: 10px 20px; background: #007bff; color: white; text-decoration: none; border-radius: 5px; }
    .btn-back:hover { opacity: 0.9; }
    #toast { position: fixed; top: 20px; left: 50%; transform: translateX(-50%); background: #333; color: white; padding: 10px 20px; border-radius: 5px; display: none; z-index: 9999; }
    @media (max-width: 600px) {
      .add-form input { width: 100%; }
      .add-form button { width: 100%; }
    }
  </style>
</head>
<body>
  <div id="toast"></div>
  <div class="container">
    <h2>⚙️ خيارات إضافية لـ "${item.name}"</h2>
    <p style="text-align:center; color:#666;">أضف خيارات مثل: إضافة جبنة، بدون بصل، حجم كبير...</p>
    
    <form method="POST" class="add-form">
      <input type="hidden" name="action" value="add">
      <input type="text" name="option_name" placeholder="اسم الخيار (مثال: إضافة جبنة)" required>
      <input type="number" name="option_price" placeholder="السعر الإضافي" step="0.01" min="0" value="0">
      <button type="submit">➕ إضافة خيار</button>
    </form>

    <table>
      <thead>
        <tr>
          <th>الخيار</th>
          <th>السعر الإضافي</th>
          <th>الإجراء</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>
    
    <a href="/admin/${res.slug}" class="btn-back">🔙 العودة للوحة المطعم</a>
  </div>

  <script>
    function showToast(message, type = 'success') {
      const toast = document.getElementById('toast');
      toast.style.backgroundColor = type === 'success' ? '#28a745' : '#dc3545';
      toast.innerText = message;
      toast.style.display = 'block';
      setTimeout(() => { toast.style.display = 'none'; }, 3000);
    }

    window.onload = function() {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('success')) {
        showToast(urlParams.get('success'), 'success');
      } else if (urlParams.get('error')) {
        showToast(urlParams.get('error'), 'error');
      }
    }
  </script>
</body>
</html>`;
}
