// ==========================================
// menu.js - صفحة المنيو العام وصفحة عن المطعم
// ==========================================
import { getRestaurantBySlug, getRestaurantSettings, getRestaurantInfo } from './db.js';

// ==========================================
// صفحة المنيو العام
// ==========================================
export async function handlePublicMenuRoute(env, slug, url) {
  const res = await getRestaurantBySlug(env, slug);
  if (!res) return new Response("المطعم غير موجود", { status: 404 });

  const info = await getRestaurantInfo(env, res.id);
  const settings = await getRestaurantSettings(env, res.id);
  const tableId = url.searchParams.get("table") || null;
  
  // جلب اسم الطاولة إذا كان tableId موجوداً
  let tableName = null;
  if (tableId) {
    const table = await env.DB.prepare("SELECT table_name FROM tables WHERE id = ? AND restaurant_id = ?").bind(tableId, res.id).first();
    tableName = table ? table.table_name : `طاولة ${tableId}`;
  }

  const { results: categories } = await env.DB.prepare(`
    SELECT c.*, 
           (SELECT json_group_array(json_object('id', i.id, 'name', i.name, 'price', i.price, 'image_url', i.image_url, 'featured', i.featured))
            FROM items i WHERE i.category_id = c.id ORDER BY i.featured DESC, i.name) as items_json
    FROM categories c
    WHERE c.restaurant_id = ?
    ORDER BY c.sort_order, c.name
  `).bind(res.id).all();

  const { results: uncategorized } = await env.DB.prepare(`
    SELECT * FROM items WHERE restaurant_id = ? AND category_id IS NULL ORDER BY featured DESC, name
  `).bind(res.id).all();

  return new Response(renderPublicMenuHTML(res, categories, uncategorized, settings, tableName, info), {
    headers: { "Content-Type": "text/html; charset=utf-8" }
  });
}

// ==========================================
// صفحة "عن المطعم"
// ==========================================
export async function handleAboutRoute(env, slug) {
  const res = await getRestaurantBySlug(env, slug);
  if (!res) return new Response("المطعم غير موجود", { status: 404 });

  const info = await getRestaurantInfo(env, res.id);
  const settings = await getRestaurantSettings(env, res.id);

  return new Response(renderAboutHTML(res, info, settings), {
    headers: { "Content-Type": "text/html; charset=utf-8" }
  });
}

// ==========================================
// API لجلب خيارات الوجبة
// ==========================================
export async function handleOptionsAPI(env, itemId) {
  try {
    const { results: options } = await env.DB.prepare(
      "SELECT id, option_name, option_price FROM item_options WHERE item_id = ? ORDER BY option_name"
    ).bind(itemId).all();

    return new Response(JSON.stringify(options || []), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}

// ==========================================
// دوال عرض HTML
// ==========================================
function renderPublicMenuHTML(res, categories, uncategorized, settings, tableName, info) {
  const themeStyles = `
    @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;600;700&family=Tajawal:wght@300;400;500;700&display=swap');
    
    :root {
      --primary: ${settings.primary_color};
      --secondary: ${settings.secondary_color};
      --font: 'Cairo', 'Tajawal', sans-serif;
      --bg-gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      --card-shadow: 0 10px 30px rgba(0,0,0,0.1);
      --hover-shadow: 0 15px 40px rgba(0,0,0,0.15);
      --transition: all 0.3s ease;
    }

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: var(--font);
      background: var(--bg-gradient);
      min-height: 100vh;
      padding: 20px;
      padding-bottom: 100px;
      position: relative;
    }

    .blur-bg {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      backdrop-filter: blur(10px);
      z-index: -1;
    }

    .menu-wrapper {
      max-width: 1200px;
      margin: 0 auto;
      position: relative;
    }

    .restaurant-header {
      background: rgba(255,255,255,0.95);
      backdrop-filter: blur(10px);
      border-radius: 30px;
      padding: 30px 20px;
      margin-bottom: 30px;
      box-shadow: var(--card-shadow);
      text-align: center;
      position: relative;
      overflow: hidden;
    }

    .restaurant-header::before {
      content: '';
      position: absolute;
      top: -50%;
      left: -50%;
      width: 200%;
      height: 200%;
      background: radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%);
      animation: rotate 20s linear infinite;
    }

    @keyframes rotate {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    .restaurant-logo {
      max-height: 100px;
      max-width: 200px;
      object-fit: contain;
      margin-bottom: 15px;
      position: relative;
      z-index: 1;
    }

    .restaurant-name {
      font-size: 2.5rem;
      font-weight: 700;
      color: var(--primary);
      margin-bottom: 10px;
      position: relative;
      z-index: 1;
      text-shadow: 2px 2px 4px rgba(0,0,0,0.1);
    }

    .table-badge {
      display: inline-block;
      background: var(--primary);
      color: white;
      padding: 8px 20px;
      border-radius: 50px;
      font-size: 1rem;
      margin: 10px 0;
      box-shadow: 0 5px 15px rgba(0,0,0,0.2);
    }

    .header-actions {
      display: flex;
      gap: 15px;
      justify-content: center;
      flex-wrap: wrap;
      margin-top: 20px;
    }

    .action-btn {
      padding: 10px 25px;
      border-radius: 50px;
      text-decoration: none;
      color: white;
      font-weight: 600;
      transition: var(--transition);
      display: inline-flex;
      align-items: center;
      gap: 5px;
      background: var(--primary);
      border: none;
      cursor: pointer;
    }

    .action-btn:hover {
      transform: translateY(-3px);
      box-shadow: 0 10px 20px rgba(0,0,0,0.2);
    }

    .search-container {
      margin: 20px 0;
    }

    .search-box {
      width: 100%;
      padding: 15px 25px;
      border: none;
      border-radius: 50px;
      font-size: 1rem;
      box-shadow: var(--card-shadow);
      transition: var(--transition);
      background: rgba(255,255,255,0.95);
    }

    .search-box:focus {
      outline: none;
      box-shadow: var(--hover-shadow);
      transform: scale(1.02);
    }

    .category-section {
      margin-bottom: 50px;
    }

    .category-title {
      font-size: 2rem;
      font-weight: 600;
      color: white;
      margin-bottom: 20px;
      padding-right: 15px;
      position: relative;
      text-shadow: 2px 2px 4px rgba(0,0,0,0.2);
    }

    .category-title::after {
      content: '';
      position: absolute;
      right: 0;
      bottom: -5px;
      width: 60px;
      height: 4px;
      background: white;
      border-radius: 2px;
    }

    .items-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 25px;
      padding: 10px;
    }

    .item-card {
      background: rgba(255,255,255,0.95);
      backdrop-filter: blur(10px);
      border-radius: 20px;
      overflow: hidden;
      transition: var(--transition);
      box-shadow: var(--card-shadow);
      position: relative;
      cursor: pointer;
      animation: fadeIn 0.5s ease;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .item-card:hover {
      transform: translateY(-10px);
      box-shadow: var(--hover-shadow);
    }

    .item-card.featured {
      border: 2px solid gold;
      position: relative;
    }

    .featured-badge {
      position: absolute;
      top: 15px;
      left: 15px;
      background: gold;
      color: #333;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.2rem;
      box-shadow: 0 5px 10px rgba(0,0,0,0.2);
      z-index: 2;
    }

    .item-image {
      width: 100%;
      height: 200px;
      object-fit: cover;
      transition: var(--transition);
    }

    .item-card:hover .item-image {
      transform: scale(1.05);
    }

    .item-content {
      padding: 20px;
    }

    .item-name {
      font-size: 1.3rem;
      font-weight: 600;
      color: #333;
      margin-bottom: 10px;
    }

    .item-price {
      color: green;
      font-weight: 700;
      font-size: 1.2rem;
      margin-bottom: 15px;
    }

    .add-to-cart-btn {
      width: 100%;
      padding: 12px;
      background: var(--primary);
      color: white;
      border: none;
      border-radius: 10px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: var(--transition);
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 5px;
    }

    .add-to-cart-btn:hover {
      background: var(--secondary);
      transform: translateY(-2px);
    }

    .floating-cart {
      position: fixed;
      bottom: 20px;
      left: 20px;
      z-index: 1000;
    }

    .cart-toggle {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--primary), var(--secondary));
      color: white;
      border: none;
      cursor: pointer;
      font-size: 1.5rem;
      box-shadow: 0 5px 20px rgba(0,0,0,0.3);
      transition: var(--transition);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .cart-toggle:hover {
      transform: scale(1.1) rotate(10deg);
    }

    .cart-count {
      position: absolute;
      top: -5px;
      right: -5px;
      background: red;
      color: white;
      width: 25px;
      height: 25px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.9rem;
      font-weight: bold;
    }

    .cart-panel {
      position: fixed;
      bottom: 90px;
      left: 20px;
      width: 320px;
      max-height: 400px;
      background: white;
      border-radius: 20px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.3);
      padding: 20px;
      overflow-y: auto;
      display: none;
    }

    .cart-panel.show {
      display: block;
      animation: slideUp 0.3s ease;
    }

    @keyframes slideUp {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .cart-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 0;
      border-bottom: 1px solid #eee;
    }

    .cart-item-details {
      flex: 1;
    }

    .cart-item-name {
      font-weight: 600;
      font-size: 0.95rem;
    }

    .cart-item-options {
      font-size: 0.8rem;
      color: #666;
    }

    .cart-item-actions {
      display: flex;
      gap: 5px;
    }

    .cart-item-actions button {
      width: 30px;
      height: 30px;
      border: none;
      border-radius: 5px;
      cursor: pointer;
      font-weight: bold;
    }

    .cart-total {
      font-weight: 700;
      font-size: 1.2rem;
      color: var(--primary);
      padding: 10px 0;
    }

    .whatsapp-btn {
      width: 100%;
      padding: 15px;
      background: #25D366;
      color: white;
      border: none;
      border-radius: 10px;
      font-weight: 600;
      cursor: pointer;
      transition: var(--transition);
      margin-top: 10px;
    }

    .whatsapp-btn:hover {
      background: #128C7E;
    }

    .options-modal {
      display: none;
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.5);
      justify-content: center;
      align-items: center;
      z-index: 2000;
      backdrop-filter: blur(5px);
    }

    .options-modal.show {
      display: flex;
    }

    .modal-content {
      background: white;
      padding: 30px;
      border-radius: 20px;
      width: 90%;
      max-width: 400px;
      max-height: 80vh;
      overflow-y: auto;
      animation: modalPop 0.3s ease;
    }

    @keyframes modalPop {
      from { opacity: 0; transform: scale(0.9); }
      to { opacity: 1; transform: scale(1); }
    }

    .modal-title {
      font-size: 1.5rem;
      color: var(--primary);
      margin-bottom: 20px;
    }

    .option-item {
      margin: 15px 0;
      padding: 10px;
      background: #f9f9f9;
      border-radius: 10px;
    }

    .modal-actions {
      display: flex;
      gap: 10px;
      margin-top: 20px;
    }

    .modal-actions button {
      flex: 1;
      padding: 12px;
      border: none;
      border-radius: 10px;
      cursor: pointer;
      font-weight: 600;
    }

    @media (max-width: 768px) {
      .restaurant-name {
        font-size: 2rem;
      }
      .items-grid {
        grid-template-columns: 1fr;
      }
      .cart-panel {
        width: calc(100% - 40px);
        left: 20px;
      }
    }
    @media (max-width: 480px) {
      body {
        padding: 10px;
      }
      .restaurant-header {
        padding: 20px 15px;
      }
      .category-title {
        font-size: 1.5rem;
      }
    }
    /* تحسينات للجوال */
@media (max-width: 768px) {
  .floating-cart {
    bottom: 15px;
    left: 15px;
  }
  .cart-toggle {
    width: 50px;
    height: 50px;
    font-size: 1.3rem;
  }
  .cart-panel {
    width: calc(100% - 30px);
    left: 15px;
    right: 15px;
    bottom: 80px;
    max-width: none;
  }
  .cart-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 5px;
  }
  .cart-item-actions {
    align-self: flex-end;
  }
}
  `;

  const tableMessage = tableName ? `<div class="table-badge">🪑 ${tableName}</div>` : '';

  let categoriesHtml = '';
  for (let cat of categories) {
    let items = [];
    try {
      items = JSON.parse(cat.items_json) || [];
    } catch { items = []; }
    
    const itemsHtml = items.map(item => `
      <div class="item-card ${item.featured ? 'featured' : ''}">
        ${item.featured ? '<div class="featured-badge">⭐</div>' : ''}
        ${item.image_url ? `<img src="${item.image_url}" class="item-image" alt="${item.name}">` : ''}
        <div class="item-content">
          <h3 class="item-name">${item.name}</h3>
          <p class="item-price">${item.price} ريال</p>
          <button class="add-to-cart-btn" data-id="${item.id}" data-name="${item.name}" data-price="${item.price}">
            <span>➕</span> أضف إلى السلة
          </button>
        </div>
      </div>
    `).join('');

    categoriesHtml += `
      <div class="category-section">
        <h2 class="category-title">${cat.name}</h2>
        <div class="items-grid">
          ${itemsHtml || '<p style="color:white; text-align:center;">لا توجد وجبات في هذه الفئة</p>'}
        </div>
      </div>
    `;
  }

  if (uncategorized.length > 0) {
    const itemsHtml = uncategorized.map(item => `
      <div class="item-card ${item.featured ? 'featured' : ''}">
        ${item.featured ? '<div class="featured-badge">⭐</div>' : ''}
        ${item.image_url ? `<img src="${item.image_url}" class="item-image" alt="${item.name}">` : ''}
        <div class="item-content">
          <h3 class="item-name">${item.name}</h3>
          <p class="item-price">${item.price} ريال</p>
          <button class="add-to-cart-btn" data-id="${item.id}" data-name="${item.name}" data-price="${item.price}">
            <span>➕</span> أضف إلى السلة
          </button>
        </div>
      </div>
    `).join('');

    categoriesHtml += `
      <div class="category-section">
        <h2 class="category-title">أخرى</h2>
        <div class="items-grid">${itemsHtml}</div>
      </div>
    `;
  }

  return `<!DOCTYPE html>
<html dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${res.res_name}</title>
  <style>${themeStyles}</style>
</head>
<body>
  <div class="blur-bg"></div>
  
  <div class="menu-wrapper">
    <!-- الهيدر -->
    <div class="restaurant-header">
      ${settings.logo_url ? `<img src="${settings.logo_url}" class="restaurant-logo">` : ''}
      <h1 class="restaurant-name">${res.res_name}</h1>
      ${tableMessage}
      
      <div class="header-actions">
        <a href="/about/${res.slug}" class="action-btn">ℹ️ عن المطعم</a>
      </div>
      
      <div class="search-container">
        <input type="text" id="searchInput" class="search-box" placeholder="🔍 ابحث عن وجبة...">
      </div>
    </div>

    <!-- محتوى المنيو -->
    ${categoriesHtml || '<div style="text-align:center; color:white;">قائمة الطعام قريباً...</div>'}
  </div>

  <!-- السلة العائمة -->
  <div class="floating-cart">
    <button class="cart-toggle" onclick="toggleCart()">
      🛒
      <span class="cart-count" id="cartCount">0</span>
    </button>
    <div class="cart-panel" id="cartPanel"></div>
  </div>

  <!-- نافذة الخيارات -->
  <div class="options-modal" id="optionsModal">
    <div class="modal-content">
      <h2 class="modal-title" id="modalItemName"></h2>
      <div id="modalOptions"></div>
      <textarea id="modalNote" placeholder="📝 ملاحظات إضافية (مثل: درجة الاستواء، بدون بصل...)" style="width:100%; padding:10px; border:1px solid #ddd; border-radius:10px; margin:10px 0;"></textarea>
      <div class="modal-actions">
        <button onclick="closeModal()" style="background:#6c757d; color:white;">إلغاء</button>
        <button onclick="confirmAdd()" style="background:var(--primary); color:white;">تأكيد الإضافة</button>
      </div>
    </div>
  </div>

  <script>
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    let currentItem = null;

// تحسينات للجوال - إعادة ربط الأحداث
document.addEventListener('DOMContentLoaded', function() {
  // ربط زر السلة
  const cartToggle = document.querySelector('.cart-toggle');
  if (cartToggle) {
    cartToggle.addEventListener('click', toggleCart);
  }
  
  // ربط أزرار الإضافة
  document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
    btn.removeEventListener('click', btnClickHandler); // إزالة أي مستمع سابق
    btn.addEventListener('click', btnClickHandler);
  });
});

function btnClickHandler(e) {
  e.stopPropagation();
  const btn = e.currentTarget;
  const id = btn.dataset.id;
  const name = btn.dataset.name;
  const price = parseFloat(btn.dataset.price);
  openOptionsModal(id, name, price);
}
function toggleCart() {
  const panel = document.getElementById('cartPanel');
  if (panel) {
    panel.classList.toggle('show');
    if (cart.length === 0) {
      panel.classList.remove('show');
    }
  }
}
    function updateCartCount() {
      const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
      document.getElementById('cartCount').innerText = totalItems;
    }

    async function openOptionsModal(id, name, price) {
      try {
        const response = await fetch('/api/options/' + id);
        const options = await response.json();
        
        document.getElementById('modalItemName').innerText = name;
        let optionsHtml = '<h4 style="margin-bottom:10px;">🔘 الخيارات المتاحة:</h4>';
        
        if (options.length > 0) {
          options.forEach(opt => {
            optionsHtml += \`
              <div class="option-item">
                <label style="display:flex; align-items:center; gap:10px;">
                  <input type="checkbox" class="option-checkbox" data-id="\${opt.id}" data-name="\${opt.option_name}" data-price="\${opt.option_price}">
                  <span>\${opt.option_name}</span>
                  \${opt.option_price > 0 ? '<span style="color:green;">(+' + opt.option_price + ' ريال)</span>' : ''}
                </label>
              </div>
            \`;
          });
        } else {
          optionsHtml += '<p style="color:#666;">لا توجد خيارات إضافية لهذه الوجبة</p>';
        }
        
        document.getElementById('modalOptions').innerHTML = optionsHtml;
        document.getElementById('optionsModal').classList.add('show');
        
        currentItem = { id, name, basePrice: price };
      } catch (err) {
        alert('حدث خطأ أثناء جلب الخيارات');
      }
    }

    function closeModal() {
      document.getElementById('optionsModal').classList.remove('show');
    }

    function confirmAdd() {
      const selectedOptions = [];
      document.querySelectorAll('.option-checkbox:checked').forEach(cb => {
        selectedOptions.push({
          id: cb.dataset.id,
          name: cb.dataset.name,
          price: parseFloat(cb.dataset.price)
        });
      });
      const note = document.getElementById('modalNote').value.trim();
      
      addToCart(currentItem.id, currentItem.name, currentItem.basePrice, selectedOptions, note);
      closeModal();
    }

    function addToCart(id, name, basePrice, options, note) {
      const totalPrice = basePrice + options.reduce((sum, opt) => sum + opt.price, 0);
      const cartItem = {
        id,
        name,
        basePrice,
        options,
        note,
        totalPrice,
        quantity: 1
      };
      
      const existingIndex = cart.findIndex(item => 
        item.id === id && 
        JSON.stringify(item.options) === JSON.stringify(options) && 
        item.note === note
      );
      
      if (existingIndex >= 0) {
        cart[existingIndex].quantity += 1;
      } else {
        cart.push(cartItem);
      }
      
      localStorage.setItem('cart', JSON.stringify(cart));
      updateCartCount();
      updateCartPanel();
    }

    function updateCartPanel() {
      const panel = document.getElementById('cartPanel');
      if (cart.length === 0) {
        panel.innerHTML = '<p style="text-align:center;">السلة فارغة</p>';
        return;
      }
      
      let total = 0;
      let html = '';
      
      cart.forEach((item, index) => {
        total += item.totalPrice * item.quantity;
        html += \`
          <div class="cart-item">
            <div class="cart-item-details">
              <div class="cart-item-name">\${item.name} x\${item.quantity}</div>
              \${item.options.length > 0 ? '<div class="cart-item-options">' + item.options.map(o => o.name).join(', ') + '</div>' : ''}
              \${item.note ? '<div class="cart-item-options">📝 ' + item.note + '</div>' : ''}
              <div>\${item.totalPrice * item.quantity} ريال</div>
            </div>
            <div class="cart-item-actions">
              <button onclick="updateQuantity(\${index}, -1)">-</button>
              <button onclick="updateQuantity(\${index}, 1)">+</button>
              <button onclick="removeItem(\${index})">🗑️</button>
            </div>
          </div>
        \`;
      });
      
      html += \`<div class="cart-total">المجموع: \${total} ريال</div>\`;
      html += \`<button class="whatsapp-btn" onclick="sendOrder()">📱 إرسال الطلب عبر واتساب</button>\`;
      html += \`<button onclick="clearCart()" style="width:100%; padding:10px; margin-top:10px; background:#dc3545; color:white; border:none; border-radius:10px;">تفريغ السلة</button>\`;
      
      panel.innerHTML = html;
    }

    function toggleCart() {
      document.getElementById('cartPanel').classList.toggle('show');
    }

    function updateQuantity(index, delta) {
      cart[index].quantity += delta;
      if (cart[index].quantity <= 0) {
        cart.splice(index, 1);
      }
      localStorage.setItem('cart', JSON.stringify(cart));
      updateCartCount();
      updateCartPanel();
    }

    function removeItem(index) {
      cart.splice(index, 1);
      localStorage.setItem('cart', JSON.stringify(cart));
      updateCartCount();
      updateCartPanel();
    }

    function clearCart() {
      cart = [];
      localStorage.setItem('cart', JSON.stringify(cart));
      updateCartCount();
      updateCartPanel();
    }

    function sendOrder() {
      if (cart.length === 0) return alert('السلة فارغة');
      const phone = "${info.whatsapp || ''}".replace(/\\D/g, '');
      if (!phone) return alert('رقم واتساب المطعم غير مضبوط');

      let orderText = 'طلب جديد من المنيو';
      if ("${tableName}") orderText += ' (' + "${tableName}" + ')';
      orderText += ':\\n';
      let total = 0;
      
      cart.forEach(item => {
        orderText += \`\\n🍽️ \${item.name} x\${item.quantity}\`;
        if (item.options.length > 0) {
          orderText += ' (' + item.options.map(o => o.name).join(', ') + ')';
        }
        if (item.note) {
          orderText += \`\\n   📝 ملاحظة: \${item.note}\`;
        }
        orderText += \`\\n   💰 \${item.totalPrice * item.quantity} ريال\`;
        total += item.totalPrice * item.quantity;
      });
      
      orderText += \`\\n\\n💰 الإجمالي: \${total} ريال\`;
      window.open(\`https://wa.me/\${phone}?text=\${encodeURIComponent(orderText)}\`, '_blank');
    }

    // ربط أزرار الإضافة
    document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.dataset.id;
        const name = btn.dataset.name;
        const price = parseFloat(btn.dataset.price);
        openOptionsModal(id, name, price);
      });
    });

    // البحث
    document.getElementById('searchInput').addEventListener('input', function(e) {
      const term = e.target.value.toLowerCase();
      document.querySelectorAll('.item-card').forEach(card => {
        const name = card.querySelector('.item-name').textContent.toLowerCase();
        card.style.display = name.includes(term) ? 'block' : 'none';
      });
    });

    // تهيئة السلة
    updateCartCount();
    updateCartPanel();
  </script>
</body>
</html>`;
}

function renderAboutHTML(res, info, settings) {
  return `<!DOCTYPE html>
<html dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>عن ${res.res_name}</title>
  <style>
    :root {
      --primary: ${settings.primary_color};
      --secondary: ${settings.secondary_color};
      --font: ${settings.font_family};
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: var(--font), Tahoma, Arial;
      background: #fafafa;
      padding: 20px;
      direction: rtl;
    }
    .container {
      max-width: 800px;
      margin: auto;
      background: white;
      padding: 25px;
      border-radius: 15px;
      box-shadow: 0 5px 15px rgba(0,0,0,0.1);
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
    }
    .logo {
      max-height: 80px;
      max-width: 100%;
      object-fit: contain;
    }
    h1 {
      color: var(--primary);
      margin: 10px 0;
    }
    .info-card {
      background: #f9f9f9;
      padding: 20px;
      border-radius: 10px;
      margin-bottom: 25px;
    }
    .info-item {
      display: flex;
      align-items: center;
      gap: 15px;
      padding: 12px 0;
      border-bottom: 1px solid #eee;
    }
    .info-item:last-child {
      border-bottom: none;
    }
    .info-icon {
      font-size: 1.5rem;
      min-width: 40px;
      text-align: center;
    }
    .info-content {
      flex: 1;
    }
    .info-label {
      font-weight: bold;
      color: #555;
      font-size: 0.9rem;
    }
    .info-value {
      font-size: 1.1rem;
    }
    .map-container {
      margin: 25px 0;
      border-radius: 10px;
      overflow: hidden;
      box-shadow: 0 2px 5px rgba(0,0,0,0.1);
    }
    .map-container iframe {
      width: 100%;
      height: 300px;
      border: none;
    }
    .social-links {
      display: flex;
      justify-content: center;
      gap: 20px;
      margin-top: 20px;
    }
    .social-link {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 50px;
      height: 50px;
      border-radius: 50%;
      background: var(--primary);
      color: white;
      text-decoration: none;
      font-size: 1.5rem;
      transition: transform 0.2s;
    }
    .social-link:hover {
      transform: scale(1.1);
    }
    .back-link {
      display: block;
      text-align: center;
      margin-top: 25px;
      padding: 12px;
      background: var(--primary);
      color: white;
      text-decoration: none;
      border-radius: 8px;
      font-weight: bold;
    }
    .back-link:hover {
      opacity: 0.9;
    }
    @media (max-width: 600px) {
      .info-item {
        flex-direction: column;
        align-items: flex-start;
        gap: 5px;
      }
      .info-icon {
        margin-bottom: 5px;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      ${settings.logo_url ? `<img src="${settings.logo_url}" class="logo">` : ''}
      <h1>عن ${res.res_name}</h1>
    </div>

    <div class="info-card">
      ${info.phone ? `
      <div class="info-item">
        <div class="info-icon">📞</div>
        <div class="info-content">
          <div class="info-label">رقم الهاتف</div>
          <div class="info-value">${info.phone}</div>
        </div>
      </div>
      ` : ''}

      ${info.whatsapp ? `
      <div class="info-item">
        <div class="info-icon">💬</div>
        <div class="info-content">
          <div class="info-label">واتساب</div>
          <div class="info-value"><a href="https://wa.me/${info.whatsapp.replace(/\D/g,'')}" target="_blank">${info.whatsapp}</a></div>
        </div>
      </div>
      ` : ''}

      ${info.address ? `
      <div class="info-item">
        <div class="info-icon">📍</div>
        <div class="info-content">
          <div class="info-label">العنوان</div>
          <div class="info-value">${info.address}</div>
        </div>
      </div>
      ` : ''}

      ${info.working_hours ? `
      <div class="info-item">
        <div class="info-icon">⏰</div>
        <div class="info-content">
          <div class="info-label">ساعات العمل</div>
          <div class="info-value">${info.working_hours}</div>
        </div>
      </div>
      ` : ''}
    </div>

    ${info.map_url ? `
    <div class="map-container">
      <iframe src="${info.map_url}" allowfullscreen="" loading="lazy"></iframe>
    </div>
    ` : ''}

    <div class="social-links">
      ${info.facebook ? `<a href="${info.facebook}" class="social-link" target="_blank">📘</a>` : ''}
      ${info.instagram ? `<a href="${info.instagram}" class="social-link" target="_blank">📷</a>` : ''}
    </div>

    <a href="/menu/${res.slug}" class="back-link">🔙 العودة إلى القائمة</a>
  </div>
</body>
</html>`;
}
