/* =========================================================================
   FORGE ATHLETICA — demo store logic (fictional brand, for tracking practice)
   -------------------------------------------------------------------------
   The store works without any tracking. Your job: add the dataLayer.

   Every place an analytics event should fire is marked:

       // TODO dataLayer: <event_name>   → now filled in, marked "DONE dataLayer"

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

/* ---------- tracking helpers (NEW) ---------- */

// Converts one of our products into the "item" shape GA4 expects.
// GA4 (and Meta, via the server container) only understand these exact field names.
function toItem(p, qty = 1, index) {
  const item = {
    item_id: p.id,
    item_name: p.name,
    item_category: p.category,
    item_variant: p.variant,
    price: p.price,
    quantity: qty,
  };
  if (index !== undefined) item.index = index; // position in a list (0 = first)
  return item;
}

// Converts a whole cart ([{ id, qty }, ...]) into a list of GA4 items.
function cartItems(cart) {
  return cart.map((l) => toItem(getProduct(l.id), l.qty));
}

// Hashes text with SHA-256 and returns it as a 64-character hex string.
// crypto.subtle is built into browsers, but only works on HTTPS pages (Netlify is HTTPS).
async function sha256(text) {
  const bytes = new TextEncoder().encode(text);
  const buffer = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(buffer)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Cleans an email (trim spaces, lowercase) then hashes it.
// Cleaning first matters: "Jo@Mail.com " and "jo@mail.com" must give the SAME hash,
// otherwise Meta/Google can't match it to their own (also cleaned + hashed) records.
async function hashEmail(raw) {
  const email = (raw || "").trim().toLowerCase();
  if (!email || !email.includes("@")) return null;
  try { return await sha256(email); } catch { return null; }
}

// Reads the stored email hash (if the shopper has entered one this session).
// sessionStorage is wiped when the tab closes, so the hash doesn't linger long-term.
function getUserData() {
  try {
    const hash = sessionStorage.getItem("fa_em_hash");
    return hash ? { sha256_email_address: hash } : undefined;
  } catch { return undefined; }
}

// Sends one ecommerce event to the dataLayer.
// 1) { ecommerce: null } clears the previous event's items, because GTM MERGES
//    dataLayer pushes — without this, old items can leak into the next event.
// 2) event_id is a unique ID per event, which Meta uses to deduplicate
//    browser Pixel + server (Conversions API) copies of the same event.
// 3) user_data (hashed email) is attached automatically once we have it.
function pushEcommerce(event, ecommerce) {
  dataLayer.push({ ecommerce: null });
  const payload = { event, event_id: crypto.randomUUID(), ecommerce };
  const userData = getUserData();
  if (userData) payload.user_data = userData;
  dataLayer.push(payload);
}

/* ---------- cart actions ---------- */
function addToCart(id, qty = 1) {
  const cart = getCart();
  const line = cart.find((l) => l.id === id);
  if (line) line.qty += qty; else cart.push({ id, qty });
  saveCart(cart);

  // DONE dataLayer: add_to_cart
  // Value uses qty, so adding 3 leggings reports 3 × £48, not £48.
  const p = getProduct(id);
  pushEcommerce("add_to_cart", {
    currency: CURRENCY,
    value: p.price * qty,
    items: [toItem(p, qty)],
  });

  showToast(`${getProduct(id).name} added to basket`);
}

function removeFromCart(id) {
  const cart = getCart();
  const line = cart.find((l) => l.id === id);
  if (!line) return;

  // DONE dataLayer: remove_from_cart
  // Fired BEFORE the line is deleted, so we still know how many were in the basket.
  const p = getProduct(id);
  pushEcommerce("remove_from_cart", {
    currency: CURRENCY,
    value: p.price * line.qty,
    items: [toItem(p, line.qty)],
  });

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

  // DONE dataLayer: view_item_list
  // Fires once, right after the products appear. index = each product's position.
  pushEcommerce("view_item_list", {
    item_list_id: "home",
    item_list_name: "Home – All products",
    items: PRODUCTS.map((p, i) => toItem(p, 1, i)),
  });

  grid.addEventListener("click", (e) => {
    const card = e.target.closest(".card");
    if (!card) return;
    // DONE dataLayer: select_item
    // Each card carries data-id and data-index, so we read which product
    // was clicked and where it sat in the grid.
    const p = getProduct(card.dataset.id);
    pushEcommerce("select_item", {
      item_list_id: "home",
      item_list_name: "Home – All products",
      items: [toItem(p, 1, Number(card.dataset.index))],
    });
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

  // DONE dataLayer: view_item
  // Only reached for real products — the "not found" check above returns early.
  pushEcommerce("view_item", {
    currency: CURRENCY,
    value: p.price,
    items: [toItem(p)],
  });

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
  // DONE dataLayer: view_cart   (fire once on page load, not on every re-render)
  // Lives here, not in renderCart(), because renderCart() re-runs after every
  // "Remove" click and would count extra basket views. Skipped if basket is empty.
  const cart = getCart();
  if (cart.length) {
    pushEcommerce("view_cart", {
      currency: CURRENCY,
      value: cartTotal(cart),
      items: cartItems(cart),
    });
  }
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

  // DONE dataLayer: begin_checkout
  pushEcommerce("begin_checkout", {
    currency: CURRENCY,
    value: cartTotal(cart),
    items: cartItems(cart),
  });

  document.querySelectorAll("input[name=shipping]").forEach((r) => r.addEventListener("change", renderTotals));

  // "async" lets us wait for the email hash to finish before sending the event.
  $("#shipping-next").addEventListener("click", async () => {
    if (!$("#shipping-form").reportValidity()) return;

    // NEW: hashed email. Looks for any email field in the shipping form,
    // hashes it in the browser, and stores ONLY the hash (never the raw email).
    const emailInput = $("#shipping-form input[type=email]");
    if (emailInput) {
      const hash = await hashEmail(emailInput.value);
      if (hash) { try { sessionStorage.setItem("fa_em_hash", hash); } catch {} }
    }

    // DONE dataLayer: add_shipping_info
    // After reportValidity(), so it only fires when the form is filled in correctly.
    // pushEcommerce() attaches the hashed email automatically from here on.
    pushEcommerce("add_shipping_info", {
      currency: CURRENCY,
      value: cartTotal(cart),
      shipping_tier: $("input[name=shipping]:checked").value,
      items: cartItems(cart),
    });

    $("#step-payment").hidden = false;
    $("#shipping-next").hidden = true;
  });

  $("#payment-form").addEventListener("submit", (e) => {
    e.preventDefault();
    // DONE dataLayer: add_payment_info
    pushEcommerce("add_payment_info", {
      currency: CURRENCY,
      value: cartTotal(cart),
      payment_type: $("input[name=payment]:checked").value,
      items: cartItems(cart),
    });

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

  // DONE dataLayer: purchase
  // Challenge answer: yes, a refresh WOULD fire purchase twice, because the
  // order is still in localStorage. Fix: after firing once, mark the saved
  // order as tracked. On refresh, tracked === true, so we skip the event.
  // value = subtotal (items only); shipping is sent separately (GA4 guidance).
  if (!order.tracked) {
    pushEcommerce("purchase", {
      transaction_id: order.transaction_id,
      currency: CURRENCY,
      value: order.subtotal,
      shipping: order.shipping,
      coupon: order.coupon || undefined,
      items: cartItems(order.items),
    });
    order.tracked = true;
    try { localStorage.setItem("fa_last_order", JSON.stringify(order)); } catch {}
  }
}

/* ---------- boot ---------- */
document.addEventListener("DOMContentLoaded", () => {
  updateCartCount();
  const page = document.body.dataset.page;
  ({ home: renderListing, product: renderProduct, cart: initCartPage, checkout: initCheckout, thanks: initThankYou }[page] || (() => {}))();
});
