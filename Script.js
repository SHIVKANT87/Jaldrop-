
"use strict";

// JalDrop demo data. Prices are examples; update before launch.
const PRODUCTS = [
  { id: "bottle-1", name: "पानी की बोतल", size: "1 लीटर", price: 20, icon: "🧴", description: "रोज़मर्रा के उपयोग के लिए" },
  { id: "jar-10", name: "वॉटर जार", size: "10 लीटर", price: 35, icon: "💧", description: "छोटे परिवार के लिए" },
  { id: "jar-20", name: "वॉटर जार", size: "20 लीटर", price: 50, icon: "🚰", description: "घर और ऑफिस के लिए" }
];

const DELIVERY_FEE = 10;
const STORAGE_CART = "jaldrop_demo_cart_v1";
const STORAGE_ORDERS = "jaldrop_demo_orders_v1";

let cart = loadJSON(STORAGE_CART, {});
let orders = loadJSON(STORAGE_ORDERS, []);

function loadJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function saveJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    alert("इस ब्राउज़र में डेटा सेव नहीं हो पाया।");
    return false;
  }
}

function rupees(amount) {
  return "₹" + Number(amount).toLocaleString("en-IN");
}

function productById(id) {
  return PRODUCTS.find(product => product.id === id);
}

function cartCount() {
  return Object.values(cart).reduce((sum, qty) => sum + qty, 0);
}

function subtotal() {
  return Object.entries(cart).reduce((sum, [id, qty]) => {
    const product = productById(id);
    return sum + (product ? product.price * qty : 0);
  }, 0);
}

function renderProducts() {
  const container = document.getElementById("product-list");

  container.innerHTML = PRODUCTS.map(product => `
    <article class="product-card">
      <div class="product-visual" aria-hidden="true">${product.icon}</div>
      <h3>${product.name} — ${product.size}</h3>
      <p>${product.description}</p>
      <div class="product-bottom">
        <span class="price">${rupees(product.price)}</span>
        <button class="add-button" data-add="${product.id}">
          + कार्ट में डालें
        </button>
      </div>
    </article>
  `).join("");

  container.querySelectorAll("[data-add]").forEach(button => {
    button.addEventListener("click", () => addToCart(button.dataset.add));
  });
}

function addToCart(id) {
  if (!productById(id)) return;

  cart[id] = Math.min(99, (Number(cart[id]) || 0) + 1);
  saveJSON(STORAGE_CART, cart);
  renderCart();
  alert("प्रोडक्ट कार्ट में जोड़ दिया गया।");
}

function changeQuantity(id, delta) {
  if (!productById(id)) return;

  const next = (Number(cart[id]) || 0) + delta;

  if (next <= 0) delete cart[id];
  else cart[id] = Math.min(99, next);

  saveJSON(STORAGE_CART, cart);
  renderCart();
}

function renderCart() {
  document.getElementById("cart-count").textContent = cartCount();
  document.getElementById("subtotal").textContent = rupees(subtotal());
  document.getElementById("delivery-fee").textContent =
    rupees(subtotal() > 0 ? DELIVERY_FEE : 0);
  document.getElementById("total").textContent =
    rupees(subtotal() + (subtotal() > 0 ? DELIVERY_FEE : 0));
  document.getElementById("cart-total").textContent =
    rupees(subtotal() + (subtotal() > 0 ? DELIVERY_FEE : 0));

  const items = document.getElementById("cart-items");
  const entries = Object.entries(cart).filter(([id, qty]) =>
    productById(id) && Number(qty) > 0
  );

  if (!entries.length) {
    items.innerHTML = "<p>आपका कार्ट खाली है। पहले पानी चुनें।</p>";
  } else {
    items.innerHTML = entries.map(([id, qty]) => {
      const product = productById(id);
      return `
        <div class="cart-item">
          <div>
            <strong>${product.name} (${product.size})</strong>
            <div>${rupees(product.price)} × ${qty}</div>
            <div class="qty-controls">
              <button type="button" data-minus="${id}" aria-label="मात्रा घटाएँ">−</button>
              <span>${qty}</span>
              <button type="button" data-plus="${id}" aria-label="मात्रा बढ़ाएँ">+</button>
            </div>
          </div>
          <strong>${rupees(product.price * qty)}</strong>
        </div>
      `;
    }).join("");

    items.querySelectorAll("[data-minus]").forEach(button =>
      button.addEventListener("click", () =>
        changeQuantity(button.dataset.minus, -1)
      )
    );

    items.querySelectorAll("[data-plus]").forEach(button =>
      button.addEventListener("click", () =>
        changeQuantity(button.dataset.plus, 1)
      )
    );
  }
}

function toggleCart() {
  const panel = document.getElementById("cart-panel");
  const backdrop = document.getElementById("cart-backdrop");
  const opening = panel.hidden;

  panel.hidden = !opening;
  backdrop.hidden = !opening;
  document.body.style.overflow = opening ? "hidden" : "";
}

function goToCheckout() {
  if (cartCount() === 0) {
    alert("पहले कार्ट में पानी जोड़ें।");
    return;
  }

  toggleCart();
  document.getElementById("checkout").scrollIntoView({ behavior: "smooth" });
  document.getElementById("customer-name").focus({ preventScroll: true });
}

function renderOrders() {
  const container = document.getElementById("order-list");

  if (!orders.length) {
    container.innerHTML = "<p>अभी इस ब्राउज़र में कोई डेमो ऑर्डर नहीं है।</p>";
    return;
  }

  container.innerHTML = orders.slice().reverse().map(order => `
    <article class="order-card">
      <h3>ऑर्डर ${order.id}</h3>
      <p><strong>ग्राहक:</strong> ${escapeHTML(order.name)}</p>
      <p><strong>प्रोडक्ट:</strong> ${order.items.map(item =>
        `${escapeHTML(item.name)} (${escapeHTML(item.size)}) × ${item.qty}`
      ).join(", ")}</p>
      <p><strong>कुल राशि:</strong> ${rupees(order.total)}</p>
      <p><strong>डिलीवरी समय:</strong> ${escapeHTML(order.time)}</p>
      <p><strong>स्टेटस:</strong> ${escapeHTML(order.status)}</p>
      <span class="status">केवल स्थानीय डेमो</span>
    </article>
  `).join("");
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

document.getElementById("order-form").addEventListener("submit", event => {
  event.preventDefault();

  if (cartCount() === 0) {
    alert("ऑर्डर से पहले कार्ट में कम से कम एक प्रोडक्ट जोड़ें।");
    return;
  }

  const form = event.currentTarget;

  if (!form.reportValidity()) return;

  const name = document.getElementById("customer-name").value.trim();
  const phone = document.getElementById("customer-phone").value.trim();
  const address = document.getElementById("customer-address").value.trim();
  const time = document.getElementById("delivery-time").value;

  if (!/^[6-9]\d{9}$/.test(phone)) {
    alert("कृपया सही 10 अंकों का भारतीय मोबाइल नंबर डालें।");
    return;
  }

  const items = Object.entries(cart).map(([id, qty]) => {
    const product = productById(id);
    return product ? {
      id: product.id,
      name: product.name,
      size: product.size,
      price: product.price,
      qty: Number(qty)
    } : null;
  }).filter(Boolean);

  const order = {
    id: "JD" + Date.now().toString().slice(-8),
    name,
    phone,
    address,
    time,
    items,
    subtotal: subtotal(),
    deliveryFee: DELIVERY_FEE,
    total: subtotal() + DELIVERY_FEE,
    status: "ऑर्डर तैयार — अभी सर्वर पर नहीं भेजा गया",
    createdAt: new Date().toISOString()
  };

  // Demo only: personal details are stored on this device/browser.
  // Do not use this local storage flow for real customer orders.
  orders.push(order);

  if (!saveJSON(STORAGE_ORDERS, orders)) {
    orders.pop();
    return;
  }

  cart = {};
  saveJSON(STORAGE_CART, cart);
  form.reset();
  renderCart();
  renderOrders();

  document.getElementById("form-message").textContent =
    `डेमो ऑर्डर ${order.id} इसी ब्राउज़र में सेव हुआ है। सप्लायर को ऑर्डर नहीं भेजा गया।`;

  document.getElementById("demo-orders").scrollIntoView({ behavior: "smooth" });
});

renderProducts();
renderCart();
renderOrders();
