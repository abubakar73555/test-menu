// ==========================================
// قالب صفحة الماستر
// ==========================================
import { formatDateForDisplay } from '../utils.js';

export function renderMasterHTML(restaurants, stats, searchParams, errorMsg = "") {
  const today = new Date().toISOString().split('T')[0];
  const expiredCount = restaurants.filter(r => r.expires_at < today).length;
  const nearExpiryCount = restaurants.filter(r => 
    !(r.expires_at < today) && (new Date(r.expires_at) - new Date(today)) / (1000*60*60*24) <= 3
  ).length;

  const rows = restaurants.map(r => {
    const isExpired = r.expires_at < today;
    const isNear = !isExpired && (new Date(r.expires_at) - new Date(today)) / (1000*60*60*24) <= 3;
    const rowStyle = isExpired ? 'background:#ffdddd;' : (isNear ? 'background:#fff3cd;' : '');
    const lastActivity = r.last_activity 
      ? (r.last_activity.action + ' في ' + formatDateForDisplay(r.last_activity.timestamp))
      : 'لا يوجد نشاط';

    let row = '<tr style="' + rowStyle + '">';
    row += '<td style="padding:10px; border-bottom:1px solid #eee;">' + r.res_name + '</td>';
    row += '<td style="padding:10px; border-bottom:1px solid #eee;">' + r.expires_at + '</td>';
    row += '<td style="padding:10px; border-bottom:1px solid #eee;">' + lastActivity + '</td>';
    row += '<td style="padding:10px; border-bottom:1px solid #eee;">';
    row += '<div style="display:flex; flex-wrap:wrap; gap:5px; justify-content:center;">';
    row += '<a href="/admin/' + r.slug + '" style="background:#007bff; color:white; padding:4px 8px; border-radius:3px; text-decoration:none; font-size:0.9rem;">إدارة</a>';
    row += '<a href="/admin/' + r.slug + '/categories" style="background:#28a745; color:white; padding:4px 8px; border-radius:3px; text-decoration:none; font-size:0.9rem;">الفئات</a>';
    row += '<a href="/admin/' + r.slug + '/settings" style="background:#17a2b8; color:white; padding:4px 8px; border-radius:3px; text-decoration:none; font-size:0.9rem;">تخصيص</a>';
    row += '<button ';
    row += 'data-id="' + r.id + '" ';
    row += 'data-name="' + r.res_name + '" ';
    row += 'data-slug="' + r.slug + '" ';
    row += 'data-expires="' + r.expires_at + '" ';
    row += 'onclick="openEditModal(this)" ';
    row += 'style="background:orange; color:white; border:none; padding:4px 8px; border-radius:3px; cursor:pointer; font-size:0.9rem;">تعديل</button>';
    row += '<form method="POST" style="display:inline;" onsubmit="return confirm(\'هل أنت متأكد من الحذف؟\');">';
    row += '<input type="hidden" name="action" value="delete">';
    row += '<input type="hidden" name="id" value="' + r.id + '">';
    row += '<button style="background:red; color:white; border:none; padding:4px 8px; border-radius:3px; cursor:pointer; font-size:0.9rem;">حذف</button>';
    row += '</form>';
    row += '</div>';
    row += '</td>';
    row += '</tr>';
    return row;
  }).join('');

  const searchParam = searchParams ? (searchParams.get("search") || "") : "";
  const statusParam = searchParams ? (searchParams.get("status") || "all") : "all";

  let html = '<!DOCTYPE html>';
  html += '<html dir="rtl">';
  html += '<head>';
  html += '  <meta charset="UTF-8">';
  html += '  <meta name="viewport" content="width=device-width, initial-scale=1.0">';
  html += '  <title>لوحة الماستر</title>';
  html += '  <style>';
  html += '    * { box-sizing: border-box; margin: 0; padding: 0; }';
  html += '    body { font-family: Tahoma, Arial, sans-serif; background: #f4f7f6; padding: 15px; }';
  html += '    .container { max-width: 1200px; margin: auto; }';
  html += '    h1 { font-size: 1.8rem; margin-bottom: 20px; color: #333; text-align: center; }';
  html += '    .stats { display: flex; gap: 15px; margin-bottom: 20px; flex-wrap: wrap; }';
  html += '    .stat-card { background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); flex: 1 1 180px; text-align: center; min-width: 140px; }';
  html += '    .stat-card h3 { margin: 0 0 10px; color: #555; font-size: 1rem; }';
  html += '    .stat-card .number { font-size: 2rem; font-weight: bold; color: #007bff; }';
  html += '    .card { background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); margin-bottom: 20px; }';
  html += '    .filters { display: flex; gap: 10px; margin-bottom: 20px; flex-wrap: wrap; }';
  html += '    .filters input, .filters select, .filters button { padding: 10px; border: 1px solid #ddd; border-radius: 5px; font-size: 1rem; }';
  html += '    .filters input { flex: 2; min-width: 200px; }';
  html += '    .filters select { flex: 1; min-width: 120px; }';
  html += '    table { width: 100%; border-collapse: collapse; text-align: right; }';
  html += '    th { background: #f0f0f0; padding: 12px; font-size: 0.95rem; }';
  html += '    td { padding: 12px; border-bottom: 1px solid #eee; }';
  html += '    .modal { display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); justify-content: center; align-items: center; z-index: 1000; }';
  html += '    .modal-content { background: white; padding: 25px; border-radius: 10px; width: 90%; max-width: 450px; max-height: 90vh; overflow-y: auto; }';
  html += '    .modal-content h3 { margin-bottom: 20px; }';
  html += '    .modal-content input { width: 100%; padding: 10px; margin: 8px 0; border: 1px solid #ddd; border-radius: 5px; }';
  html += '    .modal-content button { padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; }';
  html += '    .error { color: red; margin-bottom: 10px; }';
  html += '    .alert { padding: 12px; border-radius: 5px; margin-bottom: 20px; }';
  html += '    .alert-danger { background: #f8d7da; color: #721c24; }';
  html += '    .alert-warning { background: #fff3cd; color: #856404; }';
  html += '    #toast { position: fixed; top: 20px; left: 50%; transform: translateX(-50%); background: #333; color: white; padding: 10px 20px; border-radius: 5px; display: none; z-index: 9999; }';
  html += '    @media (max-width: 768px) {';
  html += '      body { padding: 10px; }';
  html += '      h1 { font-size: 1.5rem; }';
  html += '      .stats .stat-card { flex: 1 1 calc(50% - 10px); }';
  html += '      table, thead, tbody, th, td, tr { display: block; }';
  html += '      thead tr { position: absolute; top: -9999px; left: -9999px; }';
  html += '      tr { margin-bottom: 15px; border: 1px solid #ddd; border-radius: 8px; overflow: hidden; }';
  html += '      td { display: flex; justify-content: space-between; align-items: center; padding: 10px; text-align: right; border-bottom: 1px solid #eee; }';
  html += '      td:last-child { border-bottom: none; }';
  html += '      td:before { content: attr(data-label); font-weight: bold; margin-left: 10px; color: #555; width: 40%; }';
  html += '    }';
  html += '    @media (max-width: 480px) {';
  html += '      .stats .stat-card { flex: 1 1 100%; }';
  html += '      .filters input, .filters select, .filters button { width: 100%; }';
  html += '    }';
  html += '  </style>';
  html += '</head>';
  html += '<body>';
  html += '  <div id="toast"></div>';
  html += '  <div class="container">';
  html += '    <h1>👑 لوحة تحكم الماستر</h1>';
  if (errorMsg) html += '<div class="error">' + errorMsg + '</div>';

  html += '    <div class="stats">';
  html += '      <div class="stat-card"><h3>إجمالي المطاعم</h3><div class="number">' + stats.totalCount + '</div></div>';
  html += '      <div class="stat-card"><h3>المطاعم النشطة</h3><div class="number">' + stats.activeCount + '</div></div>';
  html += '      <div class="stat-card"><h3>المطاعم المنتهية</h3><div class="number">' + stats.expiredCount + '</div></div>';
  html += '      <div class="stat-card"><h3>إجمالي الوجبات</h3><div class="number">' + stats.totalItems + '</div></div>';
  html += '    </div>';

  if (expiredCount > 0) html += '<div class="alert alert-danger">⚠️ هناك ' + expiredCount + ' مطعم منتهي الاشتراك.</div>';
  if (nearExpiryCount > 0) html += '<div class="alert alert-warning">⏰ هناك ' + nearExpiryCount + ' مطعم على وشك الانتهاء (أقل من 3 أيام).</div>';

  html += '    <div class="card">';
  html += '      <h3>➕ إضافة مطعم جديد</h3>';
  html += '      <form method="POST" style="display:grid; grid-template-columns:repeat(auto-fit, minmax(150px,1fr)); gap:10px;">';
  html += '        <input type="hidden" name="action" value="add">';
  html += '        <input type="text" name="res_name" placeholder="اسم المطعم" required>';
  html += '        <input type="text" name="slug" placeholder="الرابط (slug)" required>';
  html += '        <input type="text" name="pass" placeholder="كلمة المرور" required>';
  html += '        <input type="date" name="created" value="' + new Date().toISOString().split('T')[0] + '" required>';
  html += '        <input type="date" name="expires" required>';
  html += '        <button type="submit" style="background:#28a745; color:white; border:none; padding:10px; border-radius:5px; cursor:pointer;">إضافة</button>';
  html += '      </form>';
  html += '    </div>';

  html += '    <div class="filters">';
  html += '      <form method="GET" style="display:flex; gap:10px; width:100%; flex-wrap:wrap;">';
  html += '        <input type="text" name="search" placeholder="بحث باسم المطعم أو slug" value="' + searchParam + '">';
  html += '        <select name="status">';
  html += '          <option value="all" ' + (statusParam === 'all' ? 'selected' : '') + '>جميع المطاعم</option>';
  html += '          <option value="active" ' + (statusParam === 'active' ? 'selected' : '') + '>النشطة فقط</option>';
  html += '          <option value="expired" ' + (statusParam === 'expired' ? 'selected' : '') + '>المنتهية فقط</option>';
  html += '        </select>';
  html += '        <button type="submit" style="background:#007bff; color:white; border:none; padding:10px 20px; border-radius:5px;">تطبيق</button>';
  html += '      </form>';
  html += '    </div>';

  html += '    <div class="card">';
  html += '      <table>';
  html += '        <thead>';
  html += '          <tr><th>اسم المطعم</th><th>تاريخ الانتهاء</th><th>آخر نشاط</th><th>الإجراءات</th></tr>';
  html += '        </thead>';
  html += '        <tbody>';
  html += (rows || '<tr><td colspan="4" style="text-align:center;">لا توجد مطاعم</td></tr>');
  html += '        </tbody>';
  html += '      </table>';
  html += '    </div>';

  html += '    <div id="editModal" class="modal" onclick="if(event.target===this) this.style.display=\'none\'">';
  html += '      <div class="modal-content">';
  html += '        <h3>✏️ تعديل المطعم</h3>';
  html += '        <form method="POST" id="editForm">';
  html += '          <input type="hidden" name="action" value="edit">';
  html += '          <input type="hidden" name="id" id="editId">';
  html += '          <div><label>اسم المطعم:</label><br><input type="text" name="res_name" id="editResName" required></div>';
  html += '          <div><label>الرابط (slug):</label><br><input type="text" name="slug" id="editSlug" required></div>';
  html += '          <div><label>كلمة المرور (اترك فارغاً إذا لم ترد التغيير):</label><br><input type="text" name="pass" id="editPass"></div>';
  html += '          <div><label>تاريخ الانتهاء:</label><br><input type="date" name="expires" id="editExpires" required></div>';
  html += '          <div style="display:flex; gap:10px; justify-content:flex-end; margin-top:15px;">';
  html += '            <button type="button" onclick="document.getElementById(\'editModal\').style.display=\'none\'" style="background:#6c757d; color:white;">إلغاء</button>';
  html += '            <button type="submit" style="background:#007bff; color:white;">حفظ التعديلات</button>';
  html += '          </div>';
  html += '        </form>';
  html += '      </div>';
  html += '    </div>';

  html += '    <script>';
  html += '      function showToast(message, type) {';
  html += '        const toast = document.getElementById("toast");';
  html += '        toast.style.backgroundColor = type === "success" ? "#28a745" : "#dc3545";';
  html += '        toast.innerText = message;';
  html += '        toast.style.display = "block";';
  html += '        setTimeout(function() { toast.style.display = "none"; }, 3000);';
  html += '      }';

  html += '      function openEditModal(btn) {';
  html += '        const id = btn.getAttribute("data-id");';
  html += '        const name = btn.getAttribute("data-name");';
  html += '        const slug = btn.getAttribute("data-slug");';
  html += '        const expires = btn.getAttribute("data-expires");';

  html += '        document.getElementById("editId").value = id;';
  html += '        document.getElementById("editResName").value = name;';
  html += '        document.getElementById("editSlug").value = slug;';
  html += '        document.getElementById("editPass").value = "";';
  html += '        document.getElementById("editExpires").value = expires;';
  html += '        document.getElementById("editModal").style.display = "flex";';
  html += '      }';

  html += '      window.onload = function() {';
  html += '        const urlParams = new URLSearchParams(window.location.search);';
  html += '        if (urlParams.get("success")) {';
  html += '          showToast(urlParams.get("success"), "success");';
  html += '        } else if (urlParams.get("error")) {';
  html += '          showToast(urlParams.get("error"), "error");';
  html += '        }';
  html += '      };';
  html += '    </script>';
  html += '  </div>';
  html += '</body>';
  html += '</html>';

  return html;
}
