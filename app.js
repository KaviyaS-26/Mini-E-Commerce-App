/* ==========================================================================
   Aura Goods — Vanilla JavaScript Application
   Practice/Demo E-Commerce shop with dynamic catalogue, stateful cart,
   live totals calculation, localStorage persistence, and checkout dialog.
   ========================================================================== */

/* --------------------------------------------------------------------------
   1. PRODUCT DATA
   Plain numbers for prices, formatted only when displayed.
   Always looked up by id with Array.find, never by array index.
-------------------------------------------------------------------------- */
const products = [
  { id: 1, name: "Minimalist Desk Mat", price: 349, category: "Workspace", imageText: "DM" },
  { id: 2, name: "Wireless Mechanical Numpad", price: 899, category: "Tech", imageText: "NP" },
  { id: 3, name: "Ceramic Artisan Mug", price: 249, category: "Living", imageText: "AM" },
  { id: 4, name: "Braided Fast-Charge Cable", price: 179, category: "Tech", imageText: "FC" },
  { id: 5, name: "Hardcover Dotted Journal", price: 199, category: "Stationery", imageText: "DJ" },
  { id: 6, name: "Anodized Aluminum Stand", price: 649, category: "Workspace", imageText: "AS" },
  { id: 7, name: "Noise-Dampening Keycaps", price: 420, category: "Tech", imageText: "KC" },
  { id: 8, name: "Insulated Steel Tumbler", price: 499, category: "Living", imageText: "ST" },
  { id: 9, name: "Precision Rollerball Pen", price: 129, category: "Stationery", imageText: "RP" }
];

/* --------------------------------------------------------------------------
   2. APPLICATION STATE
   - cart: object keyed by product ID string with positive integer quantities,
     e.g., { "1": 2, "3": 1 }.
   - activeCategory: currently selected filter ('All' or specific category).
-------------------------------------------------------------------------- */
const STORAGE_KEY = "cart";
let cart = loadCart();
let activeCategory = "All";

/* --------------------------------------------------------------------------
   3. SAVE & LOAD (localStorage with try/catch)
   Safely persists the cart object as JSON.
   Corrupted or missing data gracefully falls back to an empty cart {}.
-------------------------------------------------------------------------- */
function loadCart() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Ensure the parsed item is a valid plain object
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (error) {
    console.warn("Storage read error: resetting to empty cart.", error);
  }
  return {};
}

function saveCart() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
  } catch (error) {
    console.warn("Storage write error: unable to save cart.", error);
  }
}

/* --------------------------------------------------------------------------
   4. CURRENCY FORMATTER
   Formats all plain number prices to Indian Rupee (INR).
-------------------------------------------------------------------------- */
function formatCurrency(amount) {
  return amount.toLocaleString("en-IN", {
    style: "currency",
    currency: "INR"
  });
}

/* --------------------------------------------------------------------------
   5. CART MUTATIONS
   - addToCart(id): adds 1 unit of product id to the cart.
   - changeQuantity(id, delta): adjusts quantity; if <= 0, deletes the item.
   - removeItem(id): directly deletes the item from the cart.
-------------------------------------------------------------------------- */
function addToCart(id) {
  const key = String(id);
  cart[key] = (cart[key] || 0) + 1;
  saveCart();
  render();
}

function changeQuantity(id, delta) {
  const key = String(id);
  if (!cart[key]) return;

  const updatedQty = cart[key] + delta;
  if (updatedQty <= 0) {
    delete cart[key];
  } else {
    cart[key] = updatedQty;
  }

  saveCart();
  render();
}

function removeItem(id) {
  const key = String(id);
  if (key in cart) {
    delete cart[key];
    saveCart();
    render();
  }
}

/* --------------------------------------------------------------------------
   6. TOTALS CALCULATION (Array.reduce and delivery fee rule)
   - subtotal & itemCount computed via Array.reduce over Object.entries(cart).
   - Safely ignores any product ID that no longer exists in the products array.
   - Delivery rule:
     * Free (0) if subtotal is 0 (empty cart).
     * INR 40 if subtotal > 0 and subtotal < 500.
     * Free (0) if subtotal >= 500.
-------------------------------------------------------------------------- */
function calculateTotals() {
  const cartEntries = Object.entries(cart);

  const { subtotal, itemCount } = cartEntries.reduce(
    (acc, [idStr, quantity]) => {
      // Find product by id with Array.find, never by array index
      const product = products.find(p => p.id === Number(idStr));
      if (!product || quantity <= 0) {
        return acc; // Edge case: safely skip missing products
      }
      acc.subtotal += product.price * quantity;
      acc.itemCount += quantity;
      return acc;
    },
    { subtotal: 0, itemCount: 0 }
  );

  const deliveryFee = subtotal > 0 && subtotal < 500 ? 40 : 0;
  const grandTotal = subtotal + deliveryFee;

  return { subtotal, deliveryFee, grandTotal, itemCount };
}

/* --------------------------------------------------------------------------
   7. RENDER FUNCTIONS
   Rebuilds the entire UI from current state.
   Strictly uses createElement and textContent (never innerHTML for data).
-------------------------------------------------------------------------- */

// Category pill filters
function renderCategoryFilters() {
  const filterNav = document.getElementById("category-filters");
  filterNav.replaceChildren();

  const categories = ["All", ...new Set(products.map(p => p.category))];

  categories.forEach(category => {
    const btn = document.createElement("button");
    btn.className = `filter-btn ${category === activeCategory ? "active" : ""}`;
    btn.type = "button";
    btn.setAttribute("data-category", category);
    btn.textContent = category;
    filterNav.appendChild(btn);
  });
}

// Product catalogue grid
function renderCatalogue() {
  const grid = document.getElementById("product-grid");
  grid.replaceChildren();

  const filtered = activeCategory === "All"
    ? products
    : products.filter(p => p.category === activeCategory);

  filtered.forEach(product => {
    const card = document.createElement("article");
    card.className = "product-card";

    // Coloured placeholder image box with monogram
    const imgBox = document.createElement("div");
    imgBox.className = "product-image-box";
    imgBox.setAttribute("data-category", product.category);

    const placeholderText = document.createElement("span");
    placeholderText.className = "image-placeholder-text";
    placeholderText.textContent = product.imageText;
    imgBox.appendChild(placeholderText);

    // Card details
    const body = document.createElement("div");
    body.className = "product-body";

    const catBadge = document.createElement("span");
    catBadge.className = "product-category";
    catBadge.textContent = product.category;

    const title = document.createElement("h3");
    title.className = "product-name";
    title.textContent = product.name;

    // Card footer with price & add button
    const footer = document.createElement("div");
    footer.className = "product-footer";

    const price = document.createElement("span");
    price.className = "product-price";
    price.textContent = formatCurrency(product.price);

    const addBtn = document.createElement("button");
    addBtn.className = "btn btn-primary btn-add-cart";
    addBtn.type = "button";
    addBtn.setAttribute("data-action", "add");
    addBtn.setAttribute("data-id", String(product.id));
    addBtn.textContent = "Add to Cart";

    footer.appendChild(price);
    footer.appendChild(addBtn);

    body.appendChild(catBadge);
    body.appendChild(title);
    body.appendChild(footer);

    card.appendChild(imgBox);
    card.appendChild(body);

    grid.appendChild(card);
  });
}

// Cart items table and empty state
function renderCartTable() {
  const tbody = document.getElementById("cart-items-body");
  tbody.replaceChildren();

  const table = document.getElementById("cart-table");
  const emptyState = document.getElementById("cart-empty-message");

  const cartEntries = Object.entries(cart);
  const validEntries = cartEntries.filter(([idStr, qty]) => {
    const product = products.find(p => p.id === Number(idStr));
    return product && qty > 0;
  });

  if (validEntries.length === 0) {
    table.hidden = true;
    emptyState.hidden = false;
    return;
  }

  table.hidden = false;
  emptyState.hidden = true;

  validEntries.forEach(([idStr, quantity]) => {
    const product = products.find(p => p.id === Number(idStr));
    if (!product) return; // Edge case safeguard

    const tr = document.createElement("tr");

    // Product item column
    const tdItem = document.createElement("td");
    const cellWrap = document.createElement("div");
    cellWrap.className = "cart-item-cell";

    const badge = document.createElement("div");
    badge.className = "cart-item-badge";
    if (product.category === "Workspace") {
      badge.style.background = "linear-gradient(135deg, #1e3a8a, #3b82f6)";
    } else if (product.category === "Tech") {
      badge.style.background = "linear-gradient(135deg, #3730a3, #6366f1)";
    } else if (product.category === "Living") {
      badge.style.background = "linear-gradient(135deg, #065f46, #10b981)";
    } else if (product.category === "Stationery") {
      badge.style.background = "linear-gradient(135deg, #9a3412, #f59e0b)";
    } else {
      badge.style.background = "linear-gradient(135deg, #334155, #64748b)";
    }
    badge.textContent = product.imageText;

    const details = document.createElement("div");
    details.className = "cart-item-details";

    const name = document.createElement("span");
    name.className = "cart-item-name";
    name.textContent = product.name;

    const cat = document.createElement("span");
    cat.className = "cart-item-category";
    cat.textContent = product.category;

    details.appendChild(name);
    details.appendChild(cat);
    cellWrap.appendChild(badge);
    cellWrap.appendChild(details);
    tdItem.appendChild(cellWrap);

    // Unit Price column
    const tdPrice = document.createElement("td");
    tdPrice.className = "cart-table-price";
    tdPrice.textContent = formatCurrency(product.price);

    // Quantity stepper column
    const tdQty = document.createElement("td");
    const stepper = document.createElement("div");
    stepper.className = "qty-stepper";

    const decBtn = document.createElement("button");
    decBtn.className = "qty-btn";
    decBtn.type = "button";
    decBtn.setAttribute("data-action", "decrease");
    decBtn.setAttribute("data-id", String(product.id));
    decBtn.setAttribute("aria-label", `Decrease quantity of ${product.name}`);
    decBtn.textContent = "−";

    const qtySpan = document.createElement("span");
    qtySpan.className = "qty-value";
    qtySpan.textContent = String(quantity);

    const incBtn = document.createElement("button");
    incBtn.className = "qty-btn";
    incBtn.type = "button";
    incBtn.setAttribute("data-action", "increase");
    incBtn.setAttribute("data-id", String(product.id));
    incBtn.setAttribute("aria-label", `Increase quantity of ${product.name}`);
    incBtn.textContent = "+";

    stepper.appendChild(decBtn);
    stepper.appendChild(qtySpan);
    stepper.appendChild(incBtn);
    tdQty.appendChild(stepper);

    // Line total column
    const tdTotal = document.createElement("td");
    tdTotal.className = "cart-table-total";
    tdTotal.textContent = formatCurrency(product.price * quantity);

    // Remove action column
    const tdAction = document.createElement("td");
    const removeBtn = document.createElement("button");
    removeBtn.className = "btn-remove";
    removeBtn.type = "button";
    removeBtn.setAttribute("data-action", "remove");
    removeBtn.setAttribute("data-id", String(product.id));
    removeBtn.setAttribute("aria-label", `Remove ${product.name} from cart`);
    removeBtn.textContent = "Remove";
    tdAction.appendChild(removeBtn);

    tr.appendChild(tdItem);
    tr.appendChild(tdPrice);
    tr.appendChild(tdQty);
    tr.appendChild(tdTotal);
    tr.appendChild(tdAction);

    tbody.appendChild(tr);
  });
}

// Delivery hint banner
function renderDeliveryHint(subtotal) {
  const hintEl = document.getElementById("delivery-hint");
  hintEl.replaceChildren();

  const iconSpan = document.createElement("span");
  iconSpan.className = "hint-icon";
  iconSpan.setAttribute("aria-hidden", "true");

  const textSpan = document.createElement("span");

  if (subtotal === 0) {
    hintEl.className = "delivery-hint hint-warning";
    iconSpan.textContent = "🚚";
    textSpan.textContent = "Free delivery on all orders above " + formatCurrency(500) + " (Standard fee: " + formatCurrency(40) + ").";
  } else if (subtotal < 500) {
    hintEl.className = "delivery-hint hint-warning";
    const remaining = 500 - subtotal;
    iconSpan.textContent = "⚡";
    textSpan.textContent = `Add ${formatCurrency(remaining)} more to your cart to get FREE delivery! (Current fee: ${formatCurrency(40)})`;
  } else {
    hintEl.className = "delivery-hint hint-success";
    iconSpan.textContent = "🎉";
    textSpan.textContent = "Awesome! Your order qualifies for FREE delivery.";
  }

  hintEl.appendChild(iconSpan);
  hintEl.appendChild(textSpan);
}

// Master render function called on every cart state change
function render() {
  const { subtotal, deliveryFee, grandTotal, itemCount } = calculateTotals();

  // 1. Update Cart Badge in Header
  const badge = document.getElementById("cart-badge");
  badge.textContent = String(itemCount);
  badge.setAttribute("aria-label", `${itemCount} items in cart`);

  badge.classList.remove("badge-updated");
  // Trigger micro-animation re-flow
  void badge.offsetWidth;
  badge.classList.add("badge-updated");

  // 2. Re-render Cart Table
  renderCartTable();

  // 3. Render Delivery Fee Hint
  renderDeliveryHint(subtotal);

  // 4. Update Summary Values
  document.getElementById("summary-subtotal").textContent = formatCurrency(subtotal);
  document.getElementById("summary-delivery").textContent =
    deliveryFee === 0
      ? (subtotal === 0 ? formatCurrency(0) : "FREE")
      : formatCurrency(deliveryFee);
  document.getElementById("summary-grand-total").textContent = formatCurrency(grandTotal);

  // 5. Checkout Button Enabled / Disabled State
  const checkoutBtn = document.getElementById("checkout-btn");
  checkoutBtn.disabled = itemCount === 0;
}

/* --------------------------------------------------------------------------
   8. CHECKOUT DIALOG PREVIEW
   Populates modal summary and opens native <dialog> using showModal().
-------------------------------------------------------------------------- */
function openCheckoutPreview() {
  const dialog = document.getElementById("checkout");
  const itemsList = document.getElementById("dialog-items-list");
  itemsList.replaceChildren();

  const { subtotal, deliveryFee, grandTotal, itemCount } = calculateTotals();
  if (itemCount === 0) return;

  // Build item rows safely using createElement & textContent
  Object.entries(cart).forEach(([idStr, quantity]) => {
    const product = products.find(p => p.id === Number(idStr));
    if (!product || quantity <= 0) return;

    const li = document.createElement("li");
    li.className = "dialog-item-row";

    const infoDiv = document.createElement("div");
    infoDiv.className = "dialog-item-info";

    const nameSpan = document.createElement("span");
    nameSpan.className = "dialog-item-name";
    nameSpan.textContent = product.name;

    const metaSpan = document.createElement("span");
    metaSpan.className = "dialog-item-meta";
    metaSpan.textContent = `${quantity} × ${formatCurrency(product.price)}`;

    infoDiv.appendChild(nameSpan);
    infoDiv.appendChild(metaSpan);

    const priceSpan = document.createElement("span");
    priceSpan.className = "dialog-item-price";
    priceSpan.textContent = formatCurrency(product.price * quantity);

    li.appendChild(infoDiv);
    li.appendChild(priceSpan);
    itemsList.appendChild(li);
  });

  // Populate totals breakdown
  document.getElementById("dialog-subtotal").textContent = formatCurrency(subtotal);
  document.getElementById("dialog-delivery").textContent =
    deliveryFee === 0 ? "FREE" : formatCurrency(deliveryFee);
  document.getElementById("dialog-total").textContent = formatCurrency(grandTotal);

  dialog.showModal();
}

function closeCheckoutPreview() {
  const dialog = document.getElementById("checkout");
  dialog.close();
}

/* --------------------------------------------------------------------------
   9. EVENT DELEGATION & INITIALIZATION
   - One click listener on catalogue grid for add buttons.
   - One click listener on cart wrapper for increase, decrease, remove.
   - One click listener on category filter navigation.
-------------------------------------------------------------------------- */
function initApp() {
  // 1. Initial renders
  renderCategoryFilters();
  renderCatalogue();
  render();

  // 2. Event Delegation: Catalogue Buttons
  const catalogueContainer = document.getElementById("product-grid");
  catalogueContainer.addEventListener("click", event => {
    const button = event.target.closest("button[data-action='add']");
    if (!button) return;

    const productId = Number(button.getAttribute("data-id"));
    if (productId) {
      addToCart(productId);
    }
  });

  // 3. Event Delegation: Cart Table Buttons
  const cartWrapper = document.getElementById("cart-table-wrapper");
  cartWrapper.addEventListener("click", event => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;

    const action = button.getAttribute("data-action");
    const productId = Number(button.getAttribute("data-id"));
    if (!productId) return;

    if (action === "increase") {
      changeQuantity(productId, 1);
    } else if (action === "decrease") {
      changeQuantity(productId, -1);
    } else if (action === "remove") {
      removeItem(productId);
    }
  });

  // 4. Event Delegation: Category Filter Buttons
  const filterContainer = document.getElementById("category-filters");
  filterContainer.addEventListener("click", event => {
    const button = event.target.closest("button[data-category]");
    if (!button) return;

    activeCategory = button.getAttribute("data-category");
    renderCategoryFilters();
    renderCatalogue();
  });

  // 5. Checkout Dialog Listeners
  const checkoutBtn = document.getElementById("checkout-btn");
  checkoutBtn.addEventListener("click", openCheckoutPreview);

  document.getElementById("close-checkout-btn").addEventListener("click", closeCheckoutPreview);
  document.getElementById("close-checkout-btn-top").addEventListener("click", closeCheckoutPreview);

  // Close when clicking dialog backdrop
  const dialog = document.getElementById("checkout");
  dialog.addEventListener("click", event => {
    if (event.target === dialog) {
      dialog.close();
    }
  });
}

// Start application when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initApp);
} else {
  initApp();
}
