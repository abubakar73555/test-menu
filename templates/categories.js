export function renderCategoriesHTML(res, categories) {
  const rows = categories.map(c => `
    <tr>
      <td data-label="اسم الفئة">${c.name}</td>
      <td data-label="الإجراءات">
        <div style="display:flex; gap:5px; flex-wrap:wrap;">
          <button onclick="openEditCatModal(${c.id}, '${c.name.replace(/'/g, "\\'")}')" style="background:orange; color:white; border:none; padding:5px 10px; border-radius:3px;">تعديل</button>
          <form method="POST" style="display:inline;" onsubmit="return confirm('سيتم إزالة الفئة من الوجبات المرتبطة. استمر؟');">
            <input type="hidden" name="action" value="delete">
            <input type="hidden" name="id" value="${c.id}">
            <button style="background:red; color:white; border:none; padding:5px 10px; border-radius:3px;">حذف</button>
          </form>
        </div>
      </td>
    </tr>
  `).join('');

  return `<!DOCTYPE html>
<html dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>إدارة الفئات - ${res.res_name}</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: Tahoma, Arial, sans-serif; background: #f4f7f6; padding: 15px; margin:0; }
    .container { max-width: 600px; margin: auto; background: white; padding: 20px; border-radius: 10px; box-shadow:0 2px 10px rgba(0,0,0,0.1); }
    h2 { font-size: 1.5rem; margin-bottom: 20px; text-align: center; }
    form.add-form { display: flex; gap: 10px; margin-bottom: 20px; flex-wrap: wrap; }
    form.add-form input { flex: 1; min-width: 200px; padding: 10px; border: 1px solid #ddd; border-radius: 5px; }
    form.add-form button { padding: 10px 20px; background: #28a745; color: white; border: none; border-radius: 5px; cursor: pointer; }
    table { width: 100%; border-collapse: collapse; }
    th { background: #f0f0f0; padding: 12px; text-align: right; }
    td { padding: 12px; border-bottom: 1px solid #eee; }
    .modal { display: none; position: fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.5); justify-content:center; align-items:center; z-index:1000; }
    .modal-content { background: white; padding: 25px; border-radius: 10px; width: 90%; max-width: 400px; }
    .modal-content input { width: 100%; padding: 10px; margin: 10px 0; border: 1px solid #ddd; border-radius: 5px; }
    .modal-content button { padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; }
    a { text-decoration: none; color: #007bff; }
    #toast { position: fixed; top: 20px; left: 50%; transform: translateX(-50%); background: #333; color: white; padding: 10px 20px; border-radius: 5px; display: none; z-index: 9999; }
    @media (max-width: 600px) {
      table, thead, tbody, th, td, tr { display: block; }
      thead tr { position: absolute; top: -9999px; left: -9999px; }
      tr { margin-bottom: 15px; border: 1px solid #ddd; border-radius: 8px; overflow: hidden; }
      td { display: flex; justify-content: space-between; align-items: center; padding: 10px; border-bottom: 1px solid #eee; }
      td:last-child { border-bottom: none; }
      td:before { content: attr(data-label); font-weight: bold; margin-left: 10px; color: #555; width: 40%; }
      form.add-form input { width: 100%; }
      form.add-form button { width: 100%; }
    }
  </style>
</head>
<body>
  <div id="toast"></div>
  <div class="container">
    <h2>📁 إدارة الفئات - ${res.res_name}</h2>
    <form class="add-form" method="POST">
      <input type="hidden" name="action" value="add">
      <input type="text" name="name" placeholder="اسم الفئة" required>
      <button type="submit">إضافة فئة</button>
    </form>
    <table>
      <thead><tr><th>اسم الفئة</th><th>الإجراءات</th></tr></thead>
      <tbody>${rows || '<tr><td colspan="2" style="text-align:center;">لا توجد فئات</td></tr>'}</tbody>
    </table>
    <br>
    <a href="/admin/${res.slug}">🔙 العودة للوحة المطعم</a>
  </div>

  <div id="editCatModal" class="modal" onclick="if(event.target===this) this.style.display='none'">
    <div class="modal-content">
      <h3>✏️ تعديل الفئة</h3>
      <form method="POST">
        <input type="hidden" name="action" value="edit">
        <input type="hidden" name="id" id="editCatId">
        <input type="text" name="name" id="editCatName" required>
        <div style="display:flex; gap:10px; justify-content:flex-end;">
          <button type="button" onclick="document.getElementById('editCatModal').style.display='none'" style="background:#6c757d; color:white;">إلغاء</button>
          <button type="submit" style="background:#007bff; color:white;">حفظ</button>
        </div>
      </form>
    </div>
  </div>

  <script>
    function showToast(message, type = 'success') {
      const toast = document.getElementById('toast');
      toast.style.backgroundColor = type === 'success' ? '#28a745' : '#dc3545';
      toast.innerText = message;
      toast.style.display = 'block';
      setTimeout(() => { toast.style.display = 'none'; }, 3000);
    }

    function openEditCatModal(id, name) {
      document.getElementById('editCatId').value = id;
      document.getElementById('editCatName').value = name;
      document.getElementById('editCatModal').style.display = 'flex';
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