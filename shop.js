/* =========================================================================
   FORGE ATHLETICA — demo store logic (fictional brand, for tracking practice)
   -------------------------------------------------------------------------
   The store works without any tracking. Your job: add the dataLayer.

   Every place an analytics event should fire is marked:

       // TODO dataLayer: <event_name>

   Product data you can use is in PRODUCTS below. The cart lives in
   localStorage, so it survives page loads on GitHub Pages.
   ========================================================================= */

window.dataLayer = window.dataLayer || [];

const PRODUCTS = [
  { id: "FA-001", name: "Core Seamless Leggings", category: "Leggings", variant: "Black",    price: 48.00, colour: "#1d1d1f" },
  { id: "FA-002", name: "Core Seamless Leggings", category: "Leggings", variant: "Sage",     price: 48.00, colour: "#8fa58a" },
  { id: "FA-003", name: "Lift Sports Bra",        category: "Sports Bras", variant: "Black", price: 32.00, colour: "#2b2b2e" },
  { id: "FA-004", name: "Lift Sports Bra",        category: "Sports Bras", variant: "Clay",  price: 32.00, colour: "#c0806a" },
  { id: "FA-005", name: "Oversized Training Tee", category: "Tops",     variant: "Bone",     price: 28.00, colour: "#e4ddd0" },
  { id: "FA-006", name: "Heavyweight Hoodie",     category: "Outerwear", variant: "Charcoal", price: 62.00, colour: "#4a4a4f" },
  { id: "FA-007", name: "Lifting Shorts",         category: "Shorts",   variant: "Navy",     price: 30.00, colour: "#283a5c" },
  { id: "FA-008", name: "Gym Duffel Bag",         category: "Accessories", variant: "Black", price: 45.00, colour: "#18181a" },
];

const SHIPPING_OPTIONS = { standard: { label: "Standard (3–5 days)", cost: 3.95 }, express: { label: "Express (next day)", cost: 6.95 } };
const CURRENCY = "GBP";

/* ---------- helpers ---------- */
const $ = (s, el = document) => el.querySelector(s);
const money = (n) => "£" + n.toFixed(2);
const getProduct = (id) => PRODUCTS.find((p) => p.id === id);

function getCart() {
  try { return JSON.parse(localStorage.getItem("fa_cart")) || []; } catch { return []; }
}
function saveCart(cart) {
  try { localStorage.setItem("fa_cart", JSON.stringify(cart)); } catch {}
  updateCartCount();
}
function cartTotal(cart = getCart()) {
  return cart.reduce((sum, line) => sum + getProduct(line.id).price * line.qty, 0);
}
function updateCartCount() {
  const el = $("#cart-count");
  if (el) el.textContent = getCart().reduce((n, l) => n + l.qty, 0);
}
function swatch(p) {
  return `<div class="swatch" style="background:${p.colour}"><span>${p.category}</span></div>`;
}

/* ---------- cart actions ---------- */
function addToCart(id, qty = 1) {
  const cart = getCart();
  const line = cart.find((l) => l.id === id);
  if (line) line.qty += qty; else cart.push({ id, qty });
  saveCart(cart);

  // TODO dataLayer: add_to_cart

  showToast(`${getProduct(id).name} added to basket`);
}

function removeFromCart(id) {
  const cart = getCart();
  const line = cart.find((l) => l.id === id);
  if (!line) return;

  // TODO dataLayer: remove_from_cart

  saveCart(cart.filter((l) => l.id !== id));
  renderCart();
}

function showToast(msg) {
  const t = $("#toast");
  if (!t) return;
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove("show"), 2200);
}

/* ---------- page: home / product listing ---------- */
function renderListing() {
  const grid = $("#product-grid");
  grid.innerHTML = PRODUCTS.map((p, i) => `
    <a class="card" href="product.html?id=${p.id}" data-id="${p.id}" data-index="${i}">
      ${swatch(p)}
      <div class="card-body">
        <h3>${p.name}</h3>
        <p class="muted">${p.variant}</p>
        <p class="price">${money(p.price)}</p>
      </div>
    </a>`).join("");

  // TODO dataLayer: view_item_list

  grid.addEventListener("click", (e) => {
    const card = e.target.closest(".card");
    if (!card) return;
    // TODO dataLayer: select_item
  });
}

/* ---------- page: product detail ---------- */
function renderProduct() {
  const id = new URLSearchParams(location.search).get("id");
  const p = getProduct(id);
  const wrap = $("#product");
  if (!p) { wrap.innerHTML = `<p>Product not found. <a href="index.html">Back to shop</a></p>`; return; }

  document.title = `${p.name} – Forge Athletica`;
  wrap.innerHTML = `
    ${swatch(p)}
    <div class="pdp-info">
      <p class="muted">${p.category}</p>
      <h1>${p.name}</h1>
      <p class="muted">Colour: ${p.variant}</p>
      <p class="price big">${money(p.price)}</p>
      <label>Quantity
        <select id="qty">${[1, 2, 3, 4, 5].map((n) => `<option>${n}</option>`).join("")}</select>
      </label>
      <button id="add-btn" class="btn">Add to basket</button>
      <p class="muted small">Free returns within 30 days.</p>
    </div>`;

  // TODO dataLayer: view_item

  $("#add-btn").addEventListener("click", () => addToCart(p.id, Number($("#qty").value)));
}

/* ---------- page: cart ---------- */
function renderCart() {
  const cart = getCart();
  const wrap = $("#cart");
  if (!cart.length) {
    wrap.innerHTML = `<p>Your basket is empty. <a href="index.html">Continue shopping</a></p>`;
    return;
  }
  wrap.innerHTML = `
    <table class="lines">
      ${cart.map((l) => { const p = getProduct(l.id); return `
        <tr>
          <td>${swatch(p)}</td>
          <td><strong>${p.name}</strong><br><span class="muted">${p.variant} · Qty ${l.qty}</span></td>
          <td class="right">${money(p.price * l.qty)}</td>
          <td><button class="link remove" data-id="${p.id}">Remove</button></td>
        </tr>`; }).join("")}
    </table>
    <div class="summary">
      <p>Subtotal <strong>${money(cartTotal(cart))}</strong></p>
      <a href="checkout.html" id="checkout-btn" class="btn">Checkout</a>
    </div>`;

  wrap.querySelectorAll(".remove").forEach((b) => b.addEventListener("click", () => removeFromCart(b.dataset.id)));
}
function initCartPage() {
  renderCart();
  // TODO dataLayer: view_cart   (fire once on page load, not on every re-render)
}

/* ---------- page: checkout ---------- */
function initCheckout() {
  const cart = getCart();
  if (!cart.length) { location.href = "cart.html"; return; }

  const renderTotals = () => {
    const ship = SHIPPING_OPTIONS[$("input[name=shipping]:checked").value].cost;
    $("#co-subtotal").textContent = money(cartTotal(cart));
    $("#co-shipping").textContent = money(ship);
    $("#co-total").textContent = money(cartTotal(cart) + ship);
  };
  $("#co-items").innerHTML = cart.map((l) => { const p = getProduct(l.id);
    return `<li>${p.name} (${p.variant}) × ${l.qty}<span>${money(p.price * l.qty)}</span></li>`; }).join("");
  renderTotals();

  // TODO dataLayer: begin_checkout

  document.querySelectorAll("input[name=shipping]").forEach((r) => r.addEventListener("change", renderTotals));

  $("#shipping-next").addEventListener("click", () => {
    if (!$("#shipping-form").reportValidity()) return;
    // TODO dataLayer: add_shipping_info
    $("#step-payment").hidden = false;
    $("#shipping-next").hidden = true;
  });

  $("#payment-form").addEventListener("submit", (e) => {
    e.preventDefault();
    // TODO dataLayer: add_payment_info

    const shipKey = $("input[name=shipping]:checked").value;
    const order = {
      transaction_id: "FA-" + Date.now().toString().slice(-8),
      items: cart,
      subtotal: cartTotal(cart),
      shipping: SHIPPING_OPTIONS[shipKey].cost,
      shipping_tier: shipKey,
      payment_type: $("input[name=payment]:checked").value,
      coupon: $("#coupon").value.trim().toUpperCase() || null,
    };
    order.value = order.subtotal + order.shipping;
    try { localStorage.setItem("fa_last_order", JSON.stringify(order)); } catch {}
    saveCart([]);
    location.href = "thank-you.html";
  });
}

/* ---------- page: order confirmation ---------- */
function initThankYou() {
  let order = null;
  try { order = JSON.parse(localStorage.getItem("fa_last_order")); } catch {}
  const wrap = $("#confirmation");
  if (!order) { wrap.innerHTML = `<p>No recent order found. <a href="index.html">Back to shop</a></p>`; return; }

  wrap.innerHTML = `
    <h1>Thanks for your order</h1>
    <p>Order number <strong>${order.transaction_id}</strong></p>
    <ul class="co-items">${order.items.map((l) => { const p = getProduct(l.id);
      return `<li>${p.name} (${p.variant}) × ${l.qty}<span>${money(p.price * l.qty)}</span></li>`; }).join("")}</ul>
    <p>Shipping ${money(order.shipping)} · <strong>Total ${money(order.value)}</strong></p>
    <a class="btn" href="index.html">Continue shopping</a>`;

  // TODO dataLayer: purchase
  // Challenge: refresh this page — does purchase fire twice? How would you stop it?
}

/* ---------- boot ---------- */
document.addEventListener("DOMContentLoaded", () => {
  updateCartCount();
  const page = document.body.dataset.page;
  ({ home: renderListing, product: renderProduct, cart: initCartPage, checkout: initCheckout, thanks: initThankYou }[page] || (() => {}))();
});
