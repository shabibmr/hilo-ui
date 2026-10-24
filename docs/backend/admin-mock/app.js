/* Hilo Arte admin preview. Sample data stays in this browser tab only. */

const DB_KEY = "hilo-admin-mock-db";
const SESSION_KEY = "hilo-admin-mock-session";
const THEME_KEY = "hilo-admin-mock-theme";

const LOW_STOCK = 5;

const ui = {
  navOpen: false,
  filters: {
    products: "",
    productState: "all",
    orders: "",
    orderStatus: "all",
    customers: "",
    enquiries: "",
    enquiryState: "all",
    enquiryKind: "all",
    purchases: "",
    suppliers: "",
  },
  sortKey: "title",
  sortDir: 1,
  draftKey: null,
  draft: null,
  errors: {},
  handleTouched: false,
  modal: null,
};

let db = loadDB();
let session = loadSession();
let toastTimer = 0;

function loadSession() {
  try {
    return JSON.parse(sessionStorage.getItem(SESSION_KEY) || '{"authed":false}');
  } catch {
    return { authed: false };
  }
}

function saveSession() {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

function loadDB() {
  try {
    const raw = sessionStorage.getItem(DB_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* use seed */ }
  return seed();
}

function saveDB() {
  try {
    sessionStorage.setItem(DB_KEY, JSON.stringify(db));
  } catch {
    toast("This browser tab could not store the latest edit. Try fewer or smaller images.");
  }
}

function seed() {
  const now = Date.now();
  const iso = (ms) => new Date(ms).toISOString();
  const products = [
    product("prod-roses", "blooming-roses", "Blooming Roses", "Beginner Embroidery Experience Kit", 1899, "Beginner", 4, 14, true, true, true, ["diy-kits", "best-sellers"], ["floral", "beginner", "gift"], "https://picsum.photos/seed/hilo-roses/640/800"),
    product("prod-meadow", "wildflower-meadow", "Wildflower Meadow", "Botanical DIY Embroidery Kit", 1699, "Beginner", 3.5, 6, true, false, false, ["diy-kits"], ["botanical", "beginner"], "https://picsum.photos/seed/hilo-meadow/640/800"),
    product("prod-moon", "moonlit-garden", "Moonlit Garden", "Luxury Night Sky Embroidery Experience", 2199, "Intermediate", 6, 3, true, false, true, ["gift-experiences"], ["night", "gift"], "https://picsum.photos/seed/hilo-moon/640/800"),
    product("prod-lavender", "lavender-dreams", "Lavender Dreams", "Relaxation and Wellness Stitch Box", 1499, "Beginner", 3, 0, true, false, false, ["diy-kits"], ["calm", "beginner"], "https://picsum.photos/seed/hilo-lavender/640/800"),
    product("prod-scissors", "vintage-stork-scissors", "Vintage Stork Embroidery Scissors", "High-precision brass crafting scissors", 899, "Beginner", 0, 22, true, false, false, ["accessories"], ["tool", "brass"], "https://picsum.photos/seed/hilo-scissors/640/800"),
    product("prod-bee", "golden-bee-needle-minder", "Golden Bee Magnetic Needle Minder", "Enamel and magnet accessory", 599, "Beginner", 0, 41, true, false, false, ["accessories"], ["bee", "tool"], "https://picsum.photos/seed/hilo-bee/640/800"),
    product("prod-lily", "monsoon-lily", "Monsoon Lily", "Intermediate floral study, not on the shop yet", 2099, "Intermediate", 5, 8, false, false, false, ["diy-kits"], ["floral", "draft"], "https://picsum.photos/seed/hilo-lily/640/800"),
  ];
  products[0].whats_included = [
    "Pre-printed washed linen",
    "6-inch beechwood hoop",
    "DMC cotton and metallic threads",
    "Two tapestry needles",
    "Printed guidebook and QR lessons",
  ];
  products[0].faqs = [
    { question: "Is this kit suitable for a first stitch?", answer: "Yes. The QR lessons show each stitch slowly, and the linen arrives with the outline already printed." },
    { question: "Does the printed pattern wash off?", answer: "Yes. After stitching, rinse the linen in warm water and let it air dry." },
  ];
  products[0].shipping_info = "Free shipping on orders over Rs 1,499 inside India. Packed in the signature box.";
  products[0].short_description = "Vintage rose petals stitched with matte silk and gold highlights.";
  products[0].description = "A first kit on washed linen, with a pre-printed rose outline, gold thread, and a beechwood hoop. Most stitchers start here.";

  const customers = [
    customer("cust-ananya", "Ananya Iyer", "ananya.iyer@example.com", "+91 98450 11220", addr("Ananya Iyer", "18, 2nd Cross, Indiranagar", "Bengaluru", "Karnataka", "560038"), iso(now - 40 * 86400000)),
    customer("cust-farah", "Farah Qureshi", "farah.qureshi@example.com", "+91 90000 44128", addr("Farah Qureshi", "Flat 4, Banjara Retreat", "Hyderabad", "Telangana", "500034"), iso(now - 20 * 86400000)),
    customer("cust-rohan", "Rohan Deshpande", "rohan.deshpande@example.com", "+91 98220 77815", addr("Rohan Deshpande", "9, Prabhat Road", "Pune", "Maharashtra", "411004"), iso(now - 6 * 86400000)),
    customer("cust-leela", "Leela Mathew", "leela.mathew@example.com", "+91 97440 22091", addr("Leela Mathew", "22, Fort Kochi Beach Road", "Kochi", "Kerala", "682001"), iso(now - 30 * 86400000)),
    customer("cust-kabir", "Kabir Sethi", "kabir.sethi@example.com", "+91 98290 11844", addr("Kabir Sethi", "5, Civil Lines", "Jaipur", "Rajasthan", "302006"), iso(now - 21 * 86400000)),
  ];

  const orders = [
    order("ord-1042", customers[3], 1499, "delivered", iso(now - 12 * 86400000), "order_Rzp36Leela", "pay_Rzp36Leela"),
    order("ord-1044", customers[0], 2498, "shipped", iso(now - 2 * 86400000), "order_Rzp38Ananya", "pay_Rzp38Ananya"),
    order("ord-1046", customers[1], 2199, "paid", iso(now - 26 * 3600000), "order_Rzp40Farah", "pay_Rzp40Farah"),
    order("ord-1048", customers[2], 1699, "pending", iso(now - 4 * 60000), "order_Rzp48Rohan", null),
    order("ord-1049", customers[0], 899, "pending", iso(now - 40 * 60000), "order_Rzp49Ananya", null),
    order("ord-1038", customers[4], 2199, "cancelled", iso(now - 20 * 86400000), null, null),
  ];

  const orderItems = [
    item("oi-1", "ord-1042", "prod-lavender", "Lavender Dreams", 1499, 1),
    item("oi-2", "ord-1044", "prod-roses", "Blooming Roses", 1899, 1),
    item("oi-3", "ord-1044", "prod-bee", "Golden Bee Magnetic Needle Minder", 599, 1),
    item("oi-4", "ord-1046", "prod-moon", "Moonlit Garden", 2199, 1),
    item("oi-5", "ord-1048", "prod-meadow", "Wildflower Meadow", 1699, 1),
    item("oi-6", "ord-1049", "prod-scissors", "Vintage Stork Embroidery Scissors", 899, 1),
    item("oi-7", "ord-1038", "prod-moon", "Moonlit Garden", 2199, 1),
  ];

  const invoices = [
    invoice("inv-36", "ord-1042", "HA-00036", iso(now - 12 * 86400000), 1499),
    invoice("inv-38", "ord-1044", "HA-00038", iso(now - 2 * 86400000), 2498),
    invoice("inv-40", "ord-1046", "HA-00040", iso(now - 26 * 3600000), 2199),
  ];

  return {
    products,
    collections: [
      collection("col-kits", "diy-kits", "DIY Kits", "Embroidery kits with linen, thread, hoop, and lessons.", 1, ["blooming-roses", "wildflower-meadow"]),
      collection("col-gifts", "gift-experiences", "Gift Experiences", "Kits packed as gifts, with a longer stitch.", 2, ["moonlit-garden"]),
      collection("col-tools", "accessories", "Accessories", "Scissors, minders, and other tools.", 3, ["golden-bee-needle-minder"]),
      collection("col-best", "best-sellers", "Best Sellers", "Kits the shop features as best sellers.", 4, ["blooming-roses"]),
    ],
    customers,
    orders,
    orderItems,
    invoices,
    enquiries: [
      enquiry("enq-1", "contact", "Anjali Menon", "anjali.menon@example.com", "Do you ship the Blooming Roses kit to Kochi before 2 November?", false, iso(now - 5 * 3600000)),
      enquiry("enq-2", "workshop", "Devika Rao", "devika.rao@example.com", "Can I book a Saturday hoop workshop for four people in December? We are visiting from Mysuru.", true, iso(now - 9 * 86400000)),
      enquiry("enq-3", "contact", "Imran Shah", "imran.shah@example.com", "Can the Moonlit Garden kit be gift wrapped with a note for my sister?", false, iso(now - 2 * 3600000)),
      enquiry("enq-4", "contact", "Priya Natarajan", "priya.natarajan@example.com", "Are the stork scissors suitable for a left-handed stitcher?", true, iso(now - 15 * 86400000)),
    ],
    suppliers: [
      { id: "sup-kanchi", name: "Kanchi Thread House", phone: "+91 44 4201 7780", email: "orders@kanchithread.example", address: "41, Nyniappa Naicken Street, Chennai 600003", gstin: "33KANTH1234P1Z8" },
      { id: "sup-malabar", name: "Malabar Linen Co.", phone: "+91 490 234 1180", email: "mill@malabarlinen.example", address: "Weaving shed 2, Kannur 670001", gstin: "32MALIN5678P1Z2" },
    ],
    purchaseInvoices: [
      { id: "pur-1", supplier_id: "sup-kanchi", bill_no: "KT-118", bill_date: "2026-10-02", total: 18600, notes: "October kit restock.", created_at: iso(now - 23 * 86400000) },
    ],
    purchaseItems: [
      { id: "pi-1", purchase_id: "pur-1", product_id: "prod-roses", description: "Blooming Roses packed kits", quantity: 20, unit_cost: 640 },
      { id: "pi-2", purchase_id: "pur-1", product_id: "prod-meadow", description: "Wildflower Meadow packed kits", quantity: 10, unit_cost: 580 },
    ],
    settings: {
      id: 1,
      announcement: "Free shipping on orders over Rs 1,499.",
      hero: {
        eyebrow: "Embroidery kits from the studio",
        headline: "Stitch beauty into your quiet moments.",
        subheadline: "Beginner kits with linen, thread, a hoop, and slow lessons.",
        primaryCtaText: "Shop kits",
        primaryCtaLink: "/collections/diy-kits",
        secondaryCtaText: "See gifts",
        secondaryCtaLink: "/collections/gift-experiences",
        backgroundImage: { url: "https://picsum.photos/seed/hilo-hero/1600/900", altText: "Hands stitching a floral hoop" },
      },
      store: {
        name: "Hilo Arte",
        address: "14, Rose Lane, Indiranagar, Bengaluru 560038",
        phone: "+91 98450 22176",
        email: "hello@hiloarte.com",
        hours: "Tue to Sun, 11:00 to 18:00",
        gstin: "29HILOA1234P1Z5",
      },
      social: {
        instagram: "https://instagram.com/hiloarte",
        pinterest: "https://pinterest.com/hiloarte",
        whatsapp: "https://wa.me/919845022176",
      },
      updated_at: iso(now - 3 * 86400000),
    },
  };
}

function product(id, handle, title, subtitle, price, difficulty, hours, stock, published, best, featured, collections, tags, image) {
  return {
    id, handle, title, subtitle,
    description: subtitle + ". Sample catalog copy for the admin preview.",
    short_description: subtitle,
    price, currency_code: "INR", difficulty, estimated_hours: hours,
    images: [{ url: image, altText: title + " kit" }],
    collections, tags,
    whats_included: ["Linen", "Threads", "Needle", "Guide"],
    shipping_info: "Dispatched in 2 working days inside India.",
    faqs: [],
    is_best_seller: best, is_featured: featured, stock, published,
    created_at: "2026-08-12T10:00:00.000Z",
  };
}

function collection(id, handle, title, description, sort, featured) {
  return {
    id, handle, title, description,
    image: { url: "https://picsum.photos/seed/hilo-" + handle + "/800/600", altText: title },
    featured_product_handles: featured,
    sort_order: sort,
    published: true,
  };
}

function customer(id, name, email, phone, address, created) {
  return { id, name, email, phone, default_address: address, created_at: created };
}

function addr(fullName, line1, city, state, postalCode) {
  return { fullName, line1, line2: "", city, state, postalCode, country: "India" };
}

function order(id, customer, subtotal, status, created, rzpOrder, rzpPay) {
  return {
    id,
    customer_id: customer.id,
    customer_name: customer.name,
    customer_email: customer.email,
    customer_phone: customer.phone,
    shipping_address: JSON.parse(JSON.stringify(customer.default_address)),
    subtotal,
    currency_code: "INR",
    status,
    razorpay_order_id: rzpOrder,
    razorpay_payment_id: rzpPay,
    created_at: created,
  };
}

function item(id, orderId, productId, title, unit, qty) {
  return { id, order_id: orderId, product_id: productId, title, unit_price: unit, quantity: qty };
}

function invoice(id, orderId, no, issued, total) {
  return { id, order_id: orderId, invoice_no: no, issued_at: issued, tax_total: 0, total };
}

function enquiry(id, kind, name, email, message, handled, created) {
  return { id, kind, name, email, message, handled, created_at: created };
}

function uid(prefix) {
  return prefix + "-" + Math.random().toString(36).slice(2, 8);
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, (ch) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[ch]));
}

function inr(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency", currency: "INR", maximumFractionDigits: 2,
  }).format(Number(value) || 0);
}

function when(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleString("en-IN", {
    day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

function day(iso) {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function slugify(value) {
  return String(value || "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function getPath(obj, path) {
  return path.split(".").reduce((acc, key) => (acc == null ? acc : acc[key]), obj);
}

function setPath(obj, path, value) {
  const parts = path.split(".");
  let cur = obj;
  for (let i = 0; i < parts.length - 1; i += 1) cur = cur[parts[i]];
  cur[parts[parts.length - 1]] = value;
}

function parseRoute() {
  const raw = (location.hash || "#/").replace(/^#/, "");
  const [path, query] = raw.split("?");
  const parts = path.split("/").filter(Boolean);
  return {
    key: "#" + (path || "/"),
    name: parts[0] || "dashboard",
    id: parts[1] || null,
    extra: parts[2] || null,
    params: new URLSearchParams(query || ""),
  };
}

function go(hash) {
  if (location.hash === hash) render();
  else location.hash = hash;
}

function toast(message) {
  const el = document.querySelector(".toast");
  if (!el) return;
  el.textContent = message;
  el.hidden = !message;
  clearTimeout(toastTimer);
  if (message) toastTimer = setTimeout(() => { el.hidden = true; }, 4600);
}

function findProduct(id) { return db.products.find((row) => row.id === id); }
function findByHandle(handle) { return db.products.find((row) => row.handle === handle); }
function findOrder(id) { return db.orders.find((row) => row.id === id); }
function findCustomer(id) { return db.customers.find((row) => row.id === id); }
function findCollection(id) { return db.collections.find((row) => row.id === id); }
function findSupplier(id) { return db.suppliers.find((row) => row.id === id); }
function invoiceFor(orderId) { return db.invoices.find((row) => row.order_id === orderId); }
function itemsFor(orderId) { return db.orderItems.filter((row) => row.order_id === orderId); }
function ordersFor(customerId) { return db.orders.filter((row) => row.customer_id === customerId); }

function nextInvoiceNo() {
  const nums = db.invoices.map((row) => Number(String(row.invoice_no).replace(/\D/g, "")) || 0);
  const next = Math.max(0, ...nums) + 1;
  return "HA-" + String(next).padStart(5, "0");
}

function holdInfo(order) {
  if (order.status !== "pending") return null;
  const ageMin = (Date.now() - new Date(order.created_at).getTime()) / 60000;
  if (ageMin >= 15) return { released: true };
  return { released: false, left: Math.max(1, Math.ceil(15 - ageMin)) };
}

function statusBadge(status) {
  const map = {
    pending: ["warn", "Pending"],
    paid: ["ok", "Paid"],
    shipped: ["info", "Shipped"],
    delivered: ["ok", "Delivered"],
    cancelled: ["danger", "Cancelled"],
  };
  const [kind, label] = map[status] || ["", status];
  return `<span class="badge ${kind}">${esc(label)}</span>`;
}

function stockBadge(productRow) {
  if (productRow.stock <= 0) return '<span class="badge danger">Sold out</span>';
  if (productRow.stock < LOW_STOCK) return `<span class="badge warn">${productRow.stock} low</span>`;
  return `<span class="num">${productRow.stock}</span>`;
}

function emptyProduct() {
  return {
    id: null, handle: "", title: "", subtitle: "", description: "", short_description: "",
    price: "", currency_code: "INR", difficulty: "Beginner", estimated_hours: 0,
    images: [], collections: [], tags: [], whats_included: [], shipping_info: "", faqs: [],
    is_best_seller: false, is_featured: false, stock: 0, published: false, created_at: null,
  };
}

function emptyCollection() {
  return {
    id: null, handle: "", title: "", description: "",
    image: null, featured_product_handles: [], sort_order: db.collections.length + 1, published: true,
  };
}

function emptyCustomer() {
  return {
    id: null, name: "", email: "", phone: "",
    default_address: addr("", "", "", "", ""),
    created_at: null,
  };
}

function emptySupplier() {
  return { id: null, name: "", phone: "", email: "", address: "", gstin: "" };
}

function emptyBill() {
  return {
    id: null, supplier_id: "", bill_no: "", bill_date: new Date().toISOString().slice(0, 10),
    notes: "", lines: [{ product_id: "", description: "", quantity: 1, unit_cost: "" }],
  };
}

function emptySettings() {
  return clone(db.settings);
}

function makeDraft(route) {
  if (route.name === "products" && route.id === "new") return emptyProduct();
  if (route.name === "products" && route.id) {
    const row = findProduct(route.id);
    return row ? clone(row) : null;
  }
  if (route.name === "collections" && route.id === "new") return emptyCollection();
  if (route.name === "collections" && route.id) {
    const row = findCollection(route.id);
    return row ? clone(row) : null;
  }
  if (route.name === "orders" && route.id && route.extra !== "invoice") {
    const row = findOrder(route.id);
    return row ? clone(row) : null;
  }
  if (route.name === "customers" && route.id) {
    const row = findCustomer(route.id);
    return row ? clone(row) : null;
  }
  if (route.name === "suppliers" && route.id === "new") return emptySupplier();
  if (route.name === "suppliers" && route.id) {
    const row = findSupplier(route.id);
    return row ? clone(row) : null;
  }
  if (route.name === "purchases" && route.id === "new") return emptyBill();
  if (route.name === "settings") return emptySettings();
  return null;
}

function ensureDraft(route) {
  if (ui.draftKey === route.key) return;
  ui.draftKey = route.key;
  ui.errors = {};
  ui.handleTouched = Boolean(route.id && route.id !== "new");
  ui.draft = makeDraft(route);
}

function field(label, inner, help, error, required) {
  return `<div class="field"><span>${esc(label)}${required ? ' <i class="req">Required</i>' : ""}</span>${inner}${help ? `<small class="help">${help}</small>` : ""}${error ? `<small class="err">${esc(error)}</small>` : ""}</div>`;
}

function textInput(id, bind, value, type, extra) {
  return `<input id="${id}" type="${type || "text"}" data-bind="${bind}" value="${esc(value ?? "")}" ${extra || ""}>`;
}

function textArea(id, bind, value) {
  return `<textarea id="${id}" data-bind="${bind}">${esc(value ?? "")}</textarea>`;
}

function err(name) {
  return ui.errors[name] || "";
}

function icon(name) {
  return `<i class="ti ti-${name}" aria-hidden="true"></i>`;
}

function shell(title, actions, body) {
  const route = parseRoute();
  const link = (name, label, glyph, href) => {
    const on = name === "dashboard"
      ? route.name === "dashboard"
      : route.name === name || (name === "purchases" && route.name === "suppliers");
    return `<a href="${href}" class="${on ? "active" : ""}">${icon(glyph)}<span>${esc(label)}</span></a>`;
  };
  const nav = [
    link("dashboard", "Dashboard", "layout-dashboard", "#/"),
    `<p class="nav-label">Catalog</p>`,
    link("products", "Products", "package", "#/products"),
    link("collections", "Collections", "stack-2", "#/collections"),
    `<p class="nav-label">Sales</p>`,
    link("orders", "Orders", "shopping-bag", "#/orders"),
    link("customers", "Customers", "users", "#/customers"),
    link("enquiries", "Enquiries", "message", "#/enquiries"),
    `<p class="nav-label">Supply</p>`,
    link("purchases", "Purchases", "truck", "#/purchases"),
  ].join("");
  const settingsOn = route.name === "settings" ? "active" : "";
  return `<div class="shell">
    <aside class="sidebar ${ui.navOpen ? "open" : ""}">
      <div class="sidebar-brand"><span class="wordmark">Hilo Arte</span><span class="admin-tag">Admin</span></div>
      <nav class="nav" aria-label="Admin">${nav}</nav>
      <div class="sidebar-foot">
        <a class="${settingsOn}" href="#/settings">${icon("settings")}<span>Settings</span></a>
        <div class="who">Meera Krishnan<small>meera@hiloarte.com</small></div>
        <button class="btn" type="button" data-action="sign-out">${icon("logout")} Sign out</button>
      </div>
    </aside>
    <button class="backdrop ${ui.navOpen ? "show" : ""}" type="button" data-action="close-nav" aria-label="Close menu"></button>
    <div class="main">
      <header class="page-head">
        <button class="icon-btn menu-btn" type="button" data-action="open-nav" aria-label="Open menu">${icon("menu-2")}</button>
        <h1>${esc(title)}</h1>
        <div class="page-actions">
          ${actions || ""}
          <button class="icon-btn" type="button" data-action="toggle-theme" aria-label="Toggle color theme">${icon(document.documentElement.getAttribute("data-theme") === "dark" ? "sun" : "moon")}</button>
        </div>
      </header>
      <div class="page-body" id="content">${body}</div>
    </div>
  </div>${modalHTML()}`;
}

function modalHTML() {
  if (!ui.modal) return "";
  if (ui.modal.type === "confirm") {
    return `<div class="modal-back">
      <div class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <h2 id="modal-title">${esc(ui.modal.title)}</h2>
        <p>${esc(ui.modal.body)}</p>
        <div class="btn-row">
          <button class="btn btn-danger" type="button" data-action="confirm-modal">${esc(ui.modal.confirmLabel)}</button>
          <button class="btn" type="button" data-action="close-modal">Cancel</button>
        </div>
      </div>
    </div>`;
  }
  return "";
}

function loginHTML() {
  const error = ui.errors.login || "";
  return `<div class="login">
    <form class="login-card" data-form="login">
      <div class="wordmark">Hilo Arte</div>
      <h1>Sign in</h1>
      <p class="lede">Catalog, stock, orders, and shop settings. Public sign-up stays off.</p>
      ${field("Email", textInput("login-email", "email", "meera@hiloarte.com", "email", 'autocomplete="username"'), "", "", true)}
      <div style="height:12px"></div>
      ${field("Password", textInput("login-password", "password", "preview", "password", 'autocomplete="current-password"'), "Preview sign-in. Any non-empty password is accepted.", error, true)}
      <div class="btn-row"><button class="btn btn-primary" type="submit">Sign in</button></div>
    </form>
  </div>`;
}

function viewDashboard() {
  const pending = db.orders.filter((row) => row.status === "pending").length;
  const openEnquiries = db.enquiries.filter((row) => !row.handled).length;
  const low = db.products.filter((row) => row.published && row.stock < LOW_STOCK);
  const awaiting = db.orders.filter((row) => row.status === "pending" || row.status === "paid");
  const metrics = [
    ["Products", db.products.length, "#/products"],
    ["Low stock", low.length, "#/products?state=low"],
    ["Collections", db.collections.length, "#/collections"],
    ["Pending orders", pending, "#/orders?status=pending"],
    ["Orders", db.orders.length, "#/orders"],
    ["Open enquiries", openEnquiries, "#/enquiries?handled=open"],
  ].map(([label, value, href]) => `<a class="metric" href="${href}"><span>${esc(label)}</span><strong>${value}</strong></a>`).join("");

  const orderList = awaiting.length ? `<ul class="list-plain">${awaiting.map((row) => {
    const hold = holdInfo(row);
    const extra = hold ? (hold.released ? "Hold ended" : `Holding stock, ${hold.left} min left`) : statusLabel(row.status);
    return `<li><a href="#/orders/${row.id}">${esc(row.id)} ${esc(row.customer_name)}</a><span class="meta">${inr(row.subtotal)}</span><span class="meta">${esc(extra)}</span></li>`;
  }).join("")}</ul>` : `<p class="help">No orders are waiting.</p>`;

  const enquiryList = db.enquiries.filter((row) => !row.handled).map((row) =>
    `<li><a href="#/enquiries">${esc(row.name)}</a><span class="meta">${esc(row.kind)}</span><span class="meta">${esc(row.message.slice(0, 80))}</span></li>`
  ).join("");

  const lowRows = low.map((row) =>
    `<li><a href="#/products/${row.id}">${esc(row.title)}</a><span class="meta">${row.stock <= 0 ? "Sold out" : row.stock + " in stock"}</span></li>`
  ).join("");

  return shell("Dashboard", "", `
    <div class="home">
      <section class="sheet">
        <h2>Waiting on you</h2>
        ${orderList}
      </section>
      <div class="home-side">
        <div class="metric-grid">${metrics}</div>
        <section class="sheet">
          <h2>Open enquiries</h2>
          ${enquiryList ? `<ul class="list-plain">${enquiryList}</ul>` : `<p class="help">All enquiries are handled.</p>`}
        </section>
        <section class="sheet">
          <h2>Low stock</h2>
          ${lowRows ? `<ul class="list-plain">${lowRows}</ul>` : `<p class="help">Every published product has at least ${LOW_STOCK} in stock.</p>`}
        </section>
      </div>
    </div>
  `);
}

function statusLabel(status) {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function viewProducts() {
  const q = ui.filters.products.trim().toLowerCase();
  const state = ui.filters.productState;
  let rows = db.products.filter((row) => {
    const hay = (row.title + " " + row.handle + " " + row.tags.join(" ")).toLowerCase();
    if (q && !hay.includes(q)) return false;
    if (state === "published" && !row.published) return false;
    if (state === "drafts" && row.published) return false;
    if (state === "low" && !(row.stock < LOW_STOCK)) return false;
    if (state === "soldout" && row.stock !== 0) return false;
    return true;
  });
  rows.sort((a, b) => {
    const av = a[ui.sortKey];
    const bv = b[ui.sortKey];
    if (typeof av === "number" && typeof bv === "number") return (av - bv) * ui.sortDir;
    return String(av).localeCompare(String(bv)) * ui.sortDir;
  });
  const head = (key, label, cls) => {
    const mark = ui.sortKey === key ? (ui.sortDir > 0 ? " ↑" : " ↓") : "";
    return `<th class="${cls || ""}"><button class="sort" type="button" data-action="sort" data-key="${key}">${esc(label)}${mark}</button></th>`;
  };
  const body = rows.map((row) => `<tr>
    <td><img class="thumb" alt="" src="${esc(row.images[0] ? row.images[0].url : "")}" width="36" height="44"></td>
    <td><a class="rowlink" href="#/products/${row.id}">${esc(row.title)}</a><span class="meta">${esc(row.handle)}</span></td>
    <td class="num">${inr(row.price)}</td>
    <td class="num">${stockBadge(row)}</td>
    <td>${row.published ? '<span class="badge ok">Published</span>' : '<span class="badge">Draft</span>'}</td>
    <td>${esc(row.collections.join(", "))}</td>
  </tr>`).join("");
  return shell("Products", `<a class="btn btn-primary" href="#/products/new">${icon("plus")} New product</a>`, `
    <div class="filters">
      <label class="search">${icon("search")}<span class="sr">Search products</span>
        <input id="filter-products" type="search" data-filter="products" value="${esc(ui.filters.products)}" placeholder="Search title, handle, or tag">
      </label>
      <select aria-label="Product state" data-filter="productState">
        ${options([["all", "All states"], ["published", "Published"], ["drafts", "Drafts"], ["low", "Low stock (under 5)"], ["soldout", "Sold out"]], ui.filters.productState)}
      </select>
      <span class="count">${rows.length} shown</span>
    </div>
    ${rows.length ? `<div class="table-wrap"><table><thead><tr><th></th>${head("title", "Product")}${head("price", "Price", "num")}${head("stock", "Stock", "num")}<th>State</th><th>Collections</th></tr></thead><tbody>${body}</tbody></table></div>` : emptyBlock("No products match", "Change the search or state filter, or add a product.", `<a class="btn btn-primary" href="#/products/new">New product</a>`)}
  `);
}

function options(pairs, current) {
  return pairs.map(([value, label]) => `<option value="${esc(value)}" ${value === current ? "selected" : ""}>${esc(label)}</option>`).join("");
}

function emptyBlock(title, copy, action) {
  return `<div class="empty"><h2>${esc(title)}</h2><p>${esc(copy)}</p>${action || ""}</div>`;
}

function viewProductForm() {
  const draft = ui.draft;
  if (!draft) return shell("Product", "", emptyBlock("This product was not found", "It may have been deleted in this preview.", `<a class="btn" href="#/products">Back to products</a>`));
  const title = draft.id ? draft.title || "Edit product" : "New product";
  const checks = db.collections.map((col) => `<label class="check"><input type="checkbox" data-check-group="collections" data-value="${esc(col.handle)}" ${draft.collections.includes(col.handle) ? "checked" : ""}><span>${esc(col.title)}</span></label>`).join("");
  const images = draft.images.map((image, index) => `<article class="image-card">
      <img src="${esc(image.url)}" alt="${esc(image.altText || "Product image")}">
      ${field("Alt text", textInput("img-alt-" + index, "images." + index + ".altText", image.altText), "Used by the shop and by screen readers.", err("images." + index + ".altText"))}
      <div class="btn-row">
        <button class="btn btn-small" type="button" data-action="move-row" data-list="images" data-index="${index}" data-dir="-1">Up</button>
        <button class="btn btn-small" type="button" data-action="move-row" data-list="images" data-index="${index}" data-dir="1">Down</button>
        <button class="btn btn-small btn-danger" type="button" data-action="remove-row" data-list="images" data-index="${index}">Remove</button>
      </div>
    </article>`).join("");
  const included = draft.whats_included.map((line, index) => `<div class="repeat">
      ${textInput("inc-" + index, "whats_included." + index, line, "text", 'aria-label="Included item"')}
      <button class="btn btn-small btn-danger" type="button" data-action="remove-row" data-list="whats_included" data-index="${index}">Remove</button>
    </div>`).join("");
  const faqs = draft.faqs.map((faq, index) => `<div class="repeat faq-row">
      ${field("Question", textInput("faq-q-" + index, "faqs." + index + ".question", faq.question))}
      ${field("Answer", textArea("faq-a-" + index, "faqs." + index + ".answer", faq.answer))}
      <button class="btn btn-small btn-danger" type="button" data-action="remove-row" data-list="faqs" data-index="${index}">Remove question</button>
    </div>`).join("");
  const tags = draft.tags.map((tag, index) => `<span class="chip">${esc(tag)}<button type="button" data-action="remove-tag" data-index="${index}" aria-label="Remove ${esc(tag)}">×</button></span>`).join("");
  return shell(title, "", `<form class="workspace" data-form="product">
    <div class="workspace-main">
      <section class="block">
        <h2>Catalog copy</h2>
        <div class="grid">
          ${field("Title", textInput("f-title", "title", draft.title, "text", 'data-slug-source="1"'), "", err("title"), true)}
          ${field("Subtitle", textInput("f-subtitle", "subtitle", draft.subtitle), "Short line under the title on the product page.")}
          ${field("Handle", textInput("f-handle", "handle", draft.handle, "text", ui.handleTouched ? 'data-touched="1"' : ""), "Shop URL slug. New products follow the title until you edit this.", err("handle"), true)}
          ${field("Short description", textArea("f-short", "short_description", draft.short_description), "Used on collection cards.")}
          <div class="span-2">${field("Description", textArea("f-desc", "description", draft.description))}</div>
        </div>
      </section>
      <section class="block">
        <h2>Images</h2>
        <p class="help">Upload goes to the product-images bucket in the real app. Here the file stays in this tab. First image is the cover.</p>
        <div class="images">${images || `<p class="help">No images yet.</p>`}</div>
        <div class="btn-row"><label class="btn">${icon("plus")} Add images<input class="sr" type="file" accept="image/*" multiple data-action="add-images"></label></div>
      </section>
      <section class="block">
        <h2>Collections and tags</h2>
        <div class="grid">
          <div><div class="check-head">Collections</div><div class="checks" style="margin-top:8px">${checks || `<p class="help">Add a collection first.</p>`}</div></div>
          <div>
            ${field("Add a tag", `<div class="prefix"><input id="tag-input" type="text" placeholder="floral">${`<button class="btn" type="button" data-action="add-tag">Add</button>`}</div>`, "Press Add. Tags are filters on the shop, not a second set of collections.")}
            <div class="chips" style="margin-top:8px">${tags}</div>
          </div>
        </div>
      </section>
      <section class="block">
        <h2>What is included</h2>
        <div class="stack">${included || `<p class="help">No lines yet.</p>`}</div>
        <div class="btn-row"><button class="btn" type="button" data-action="add-row" data-list="whats_included">Add line</button></div>
      </section>
      <section class="block">
        <h2>Shipping note</h2>
        ${field("Shipping info", textArea("f-ship", "shipping_info", draft.shipping_info), "Shown on the product page. This is copy, not a live rate.")}
      </section>
      <section class="block">
        <h2>Questions</h2>
        <div class="stack">${faqs || `<p class="help">No questions yet.</p>`}</div>
        <div class="btn-row"><button class="btn" type="button" data-action="add-row" data-list="faqs">Add question</button></div>
      </section>
    </div>
    <aside class="workspace-side">
      <h2>Price and stock</h2>
      <div class="rail-fields">
        ${field("Price", `<div class="prefix"><span>₹</span>${textInput("f-price", "price", draft.price, "number", 'min="0" step="1"')}</div>`, "One price. Variants are not in v1.", err("price"), true)}
        ${field("Currency", textInput("f-currency", "currency_code", "INR", "text", "readonly"), "v1 prices are in INR.")}
        ${field("Stock", textInput("f-stock", "stock", draft.stock, "number", 'min="0" step="1"'), "Available units. Pending orders hold stock for 15 minutes.", err("stock"), true)}
        ${field("Difficulty", `<select data-bind="difficulty">${options([["Beginner", "Beginner"], ["Intermediate", "Intermediate"], ["Advanced", "Advanced"]], draft.difficulty)}</select>`)}
        ${field("Estimated hours", textInput("f-hours", "estimated_hours", draft.estimated_hours, "number", 'min="0" step="0.1"'), "Shown on the kit. Use 0 for tools.")}
      </div>
      <label class="switch"><input type="checkbox" data-bind="published" ${draft.published ? "checked" : ""}><span>Published</span></label>
      <label class="switch"><input type="checkbox" data-bind="is_best_seller" ${draft.is_best_seller ? "checked" : ""}><span>Best seller</span></label>
      <label class="switch"><input type="checkbox" data-bind="is_featured" ${draft.is_featured ? "checked" : ""}><span>Featured</span></label>
      <p class="help">Drafts stay hidden on the shop. The shop reads published products with the public key.</p>
      ${draft.created_at ? `<p class="help">Added ${esc(day(draft.created_at))}.</p>` : ""}
      <div class="btn-row">
        <button class="btn btn-primary" type="submit">Save product</button>
        <a class="btn" href="#/products">Cancel</a>
        ${draft.id ? `<button class="btn btn-danger" type="button" data-action="ask-delete-product">Delete</button>` : ""}
      </div>
    </aside>
  </form>`);
}

function viewCollections() {
  const rows = [...db.collections].sort((a, b) => a.sort_order - b.sort_order);
  const body = rows.map((row) => `<tr>
    <td class="num">${row.sort_order}</td>
    <td><a class="rowlink" href="#/collections/${row.id}">${esc(row.title)}</a><span class="meta">${esc(row.handle)}</span></td>
    <td>${row.published ? '<span class="badge ok">Published</span>' : '<span class="badge">Hidden</span>'}</td>
    <td class="num">${db.products.filter((productRow) => productRow.collections.includes(row.handle)).length}</td>
  </tr>`).join("");
  return shell("Collections", `<a class="btn btn-primary" href="#/collections/new">${icon("plus")} New collection</a>`, `
    <p class="note">Collections are the product categories on the shop. The existing collections table is the category list.</p>
    <div class="table-wrap"><table><thead><tr><th class="num">Sort</th><th>Collection</th><th>State</th><th class="num">Products</th></tr></thead><tbody>${body}</tbody></table></div>
  `);
}

function viewCollectionForm() {
  const draft = ui.draft;
  if (!draft) return shell("Collection", "", emptyBlock("This collection was not found", "It may have been deleted in this preview.", `<a class="btn" href="#/collections">Back to collections</a>`));
  const title = draft.id ? draft.title : "New collection";
  const featured = db.products.map((row) => `<label class="check"><input type="checkbox" data-check-group="featured_product_handles" data-value="${esc(row.handle)}" ${draft.featured_product_handles.includes(row.handle) ? "checked" : ""}><span>${esc(row.title)}</span></label>`).join("");
  const image = draft.image ? `<article class="image-card"><img src="${esc(draft.image.url)}" alt="${esc(draft.image.altText || "")}">
      ${field("Alt text", textInput("col-alt", "image.altText", draft.image.altText))}
      <button class="btn btn-small btn-danger" type="button" data-action="clear-collection-image">Remove image</button></article>` : `<p class="help">No image yet.</p>`;
  return shell(title, "", `<form class="workspace" data-form="collection">
    <div class="workspace-main">
      <section class="block">
        <div class="grid">
          ${field("Title", textInput("c-title", "title", draft.title, "text", 'data-slug-source="1"'), "", err("title"), true)}
          ${field("Handle", textInput("f-handle", "handle", draft.handle, "text", ui.handleTouched ? 'data-touched="1"' : ""), "Used in product records and shop URLs.", err("handle"), true)}
          <div class="span-2">${field("Description", textArea("c-desc", "description", draft.description))}</div>
        </div>
      </section>
      <section class="block">
        <h2>Featured products</h2>
        <p class="help">Handles stored on the collection. The shop can feature these inside the category.</p>
        <div class="checks">${featured}</div>
      </section>
    </div>
    <aside class="workspace-side">
      <h2>Display</h2>
      <div class="rail-fields">
        ${field("Sort order", textInput("c-sort", "sort_order", draft.sort_order, "number", 'step="1"'), "Lower numbers appear first.")}
        <label class="switch"><input type="checkbox" data-bind="published" ${draft.published ? "checked" : ""}><span>Published</span></label>
      </div>
      <section class="block">
        <h2>Image</h2>
        ${image}
        <div class="btn-row"><label class="btn">Upload image<input class="sr" type="file" accept="image/*" data-action="set-collection-image"></label></div>
      </section>
      <div class="btn-row">
        <button class="btn btn-primary" type="submit">Save collection</button>
        <a class="btn" href="#/collections">Cancel</a>
        ${draft.id ? `<button class="btn btn-danger" type="button" data-action="ask-delete-collection">Delete</button>` : ""}
      </div>
    </aside>
  </form>`);
}

function viewOrders() {
  const q = ui.filters.orders.trim().toLowerCase();
  const status = ui.filters.orderStatus;
  const rows = db.orders.filter((row) => {
    const hay = (row.id + " " + row.customer_name + " " + row.customer_email).toLowerCase();
    if (q && !hay.includes(q)) return false;
    if (status !== "all" && row.status !== status) return false;
    return true;
  }).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  const body = rows.map((row) => {
    const inv = invoiceFor(row.id);
    return `<tr>
      <td><a class="rowlink" href="#/orders/${row.id}">${esc(row.id)}</a><span class="meta">${esc(when(row.created_at))}</span></td>
      <td>${esc(row.customer_name)}<span class="meta">${esc(row.customer_email)}</span></td>
      <td class="num">${inr(row.subtotal)}</td>
      <td>${statusBadge(row.status)}</td>
      <td>${inv ? esc(inv.invoice_no) : "Not invoiced"}</td>
    </tr>`;
  }).join("");
  return shell("Orders", "", `
    <div class="filters">
      <label class="search">${icon("search")}<span class="sr">Search orders</span>
        <input id="filter-orders" type="search" data-filter="orders" value="${esc(ui.filters.orders)}" placeholder="Search name, email, or order id">
      </label>
      <select aria-label="Order status" data-filter="orderStatus">
        ${options([["all", "All statuses"], ["pending", "Pending"], ["paid", "Paid"], ["shipped", "Shipped"], ["delivered", "Delivered"], ["cancelled", "Cancelled"]], ui.filters.orderStatus)}
      </select>
      <span class="count">${rows.length} shown</span>
    </div>
    <p class="note">The shop sends product ids and quantities only. Prices are read from the catalog when the order is created. Unpaid orders hold stock for 15 minutes.</p>
    ${rows.length ? `<div class="table-wrap"><table><thead><tr><th>Order</th><th>Customer</th><th class="num">Total</th><th>Status</th><th>Invoice</th></tr></thead><tbody>${body}</tbody></table></div>` : emptyBlock("No orders match", "Change the search or status filter.", "")}
  `);
}

function viewOrder() {
  const draft = ui.draft;
  if (!draft) return shell("Order", "", emptyBlock("This order was not found", "It may have been removed in this preview.", `<a class="btn" href="#/orders">Back to orders</a>`));
  const lines = itemsFor(draft.id);
  const inv = invoiceFor(draft.id);
  const hold = holdInfo(draft);
  const holdNote = !hold ? "" : hold.released
    ? `<p class="note">The 15 minute hold has ended. Those units are available to sell again.</p>`
    : `<p class="note">This unpaid order is holding stock for ${hold.left} more minute${hold.left === 1 ? "" : "s"}.</p>`;
  const address = draft.shipping_address;
  const lineRows = lines.map((line) => `<tr>
    <td>${esc(line.title)}</td>
    <td class="num">${line.quantity}</td>
    <td class="num">${inr(line.unit_price)}</td>
    <td class="num">${inr(line.unit_price * line.quantity)}</td>
  </tr>`).join("");
  return shell(draft.id, inv ? `<a class="btn" href="#/orders/${draft.id}/invoice">${icon("printer")} Invoice ${esc(inv.invoice_no)}</a>` : "", `<form class="workspace" data-form="order">
    <div class="workspace-main">
      ${holdNote}
      <section class="block">
        <h2>Customer</h2>
        <p class="help">These fields change this order only. <a href="#/customers/${esc(draft.customer_id || "")}">Open the customer record</a> to edit the person.</p>
        <div class="grid">
          ${field("Name", textInput("o-name", "customer_name", draft.customer_name), "", err("customer_name"), true)}
          ${field("Email", textInput("o-email", "customer_email", draft.customer_email, "email"), "", err("customer_email"), true)}
          ${field("Phone", textInput("o-phone", "customer_phone", draft.customer_phone, "tel"))}
        </div>
      </section>
      <section class="block">
        <h2>Ship to</h2>
        <div class="grid">
          ${field("Full name", textInput("o-fn", "shipping_address.fullName", address.fullName))}
          ${field("Line 1", textInput("o-l1", "shipping_address.line1", address.line1), "", err("line1"), true)}
          ${field("Line 2", textInput("o-l2", "shipping_address.line2", address.line2))}
          ${field("City", textInput("o-city", "shipping_address.city", address.city))}
          ${field("State", textInput("o-state", "shipping_address.state", address.state))}
          ${field("Postal code", textInput("o-pin", "shipping_address.postalCode", address.postalCode))}
          ${field("Country", textInput("o-country", "shipping_address.country", address.country))}
        </div>
      </section>
      <section class="block">
        <h2>Lines</h2>
        <p class="help">Titles and prices are the snapshot from checkout. They do not follow later catalog edits.</p>
        <div class="table-wrap"><table><thead><tr><th>Item</th><th class="num">Qty</th><th class="num">Unit</th><th class="num">Amount</th></tr></thead><tbody>${lineRows}</tbody></table></div>
        <p style="text-align:right;font-weight:700;margin-top:8px">Subtotal ${inr(draft.subtotal)}</p>
      </section>
    </div>
    <aside class="workspace-side">
      <h2>Status</h2>
      <div class="rail-fields">
        ${field("Order status", `<select data-bind="status">${options([["pending", "Pending"], ["paid", "Paid"], ["shipped", "Shipped"], ["delivered", "Delivered"], ["cancelled", "Cancelled"]], draft.status)}</select>`, "Marking an order paid issues the next HA invoice if it does not have one.")}
        ${field("Placed", `<input id="o-when" type="text" readonly value="${esc(when(draft.created_at))}">`)}
        ${field("Razorpay order", textInput("o-rz", "razorpay_order_id", draft.razorpay_order_id || "", "text", "readonly"), "Set by the create-order function.")}
        ${field("Razorpay payment", textInput("o-pay", "razorpay_payment_id", draft.razorpay_payment_id || "", "text", "readonly"), "Filled when the webhook marks the order paid.")}
      </div>
      <div class="btn-row">
        <button class="btn btn-primary" type="submit">Save order</button>
        <a class="btn" href="#/orders">Back</a>
      </div>
    </aside>
  </form>`);
}

function viewInvoice() {
  const route = parseRoute();
  const orderRow = findOrder(route.id);
  const inv = orderRow && invoiceFor(orderRow.id);
  if (!orderRow || !inv) {
    return shell("Invoice", "", emptyBlock("No invoice on this order", "An invoice is issued when the order is marked paid.", `<a class="btn" href="#/orders/${esc(route.id || "")}">Back to order</a>`));
  }
  const store = db.settings.store;
  const lines = itemsFor(orderRow.id).map((line) => `<tr>
    <td>${esc(line.title)}</td><td class="num">${line.quantity}</td><td class="num">${inr(line.unit_price)}</td><td class="num">${inr(line.unit_price * line.quantity)}</td>
  </tr>`).join("");
  const address = orderRow.shipping_address;
  return shell("Invoice " + inv.invoice_no, `<button class="btn btn-primary no-print" type="button" data-action="print">${icon("printer")} Print</button>`, `
    <article class="invoice">
      <div class="invoice-top">
        <div>
          <div class="wordmark">${esc(store.name || "Hilo Arte")}</div>
          <p>${esc(store.address)}</p>
          <p>${esc(store.email)}</p>
          <p>${esc(store.phone)}</p>
          <p>GSTIN ${esc(store.gstin || "Not set")}</p>
        </div>
        <div style="text-align:right">
          <h1>Invoice</h1>
          <p>${esc(inv.invoice_no)}</p>
          <p>${esc(day(inv.issued_at))}</p>
          <p>Order ${esc(orderRow.id)}</p>
        </div>
      </div>
      <div class="invoice-parties" style="margin-top:22px">
        <div>
          <h2>Bill to</h2>
          <p>${esc(orderRow.customer_name)}</p>
          <p>${esc(address.line1)} ${esc(address.line2 || "")}</p>
          <p>${esc(address.city)}, ${esc(address.state)} ${esc(address.postalCode)}</p>
          <p>${esc(orderRow.customer_email)}</p>
        </div>
        <div style="text-align:right">
          <p>${statusBadge(orderRow.status)}</p>
          <p class="meta">Payment ${esc(orderRow.razorpay_payment_id || "Not recorded")}</p>
        </div>
      </div>
      <table><thead><tr><th>Item</th><th class="num">Qty</th><th class="num">Unit</th><th class="num">Amount</th></tr></thead><tbody>${lines}</tbody></table>
      <div class="totals">
        <div><span>Subtotal</span><span>${inr(orderRow.subtotal)}</span></div>
        <div><span>Tax</span><span>${inr(inv.tax_total)}</span></div>
        <div class="grand"><span>Total</span><span>${inr(inv.total)}</span></div>
      </div>
      <p class="help" style="margin-top:18px">GST rules are not set. Tax is 0 until a rate is chosen. This is a sample invoice from the preview.</p>
    </article>
    <p class="no-print" style="margin-top:12px"><a href="#/orders/${esc(orderRow.id)}">Back to order</a></p>
  `);
}

function viewCustomers() {
  const q = ui.filters.customers.trim().toLowerCase();
  const rows = db.customers.filter((row) => {
    const hay = (row.name + " " + row.email + " " + (row.phone || "")).toLowerCase();
    return !q || hay.includes(q);
  }).sort((a, b) => a.name.localeCompare(b.name));
  const body = rows.map((row) => `<tr>
    <td><a class="rowlink" href="#/customers/${row.id}">${esc(row.name)}</a><span class="meta">${esc(row.email)}</span></td>
    <td>${esc(row.phone || "")}</td>
    <td class="num">${ordersFor(row.id).length}</td>
    <td>${esc(day(row.created_at))}</td>
  </tr>`).join("");
  return shell("Customers", "", `
    <p class="note">Guest checkout only. A customer record is created from the email at order time. There is no customer login in v1.</p>
    <div class="filters">
      <label class="search">${icon("search")}<span class="sr">Search customers</span>
        <input id="filter-customers" type="search" data-filter="customers" value="${esc(ui.filters.customers)}" placeholder="Search name, email, or phone">
      </label>
      <span class="count">${rows.length} shown</span>
    </div>
    ${rows.length ? `<div class="table-wrap"><table><thead><tr><th>Customer</th><th>Phone</th><th class="num">Orders</th><th>Since</th></tr></thead><tbody>${body}</tbody></table></div>` : emptyBlock("No customers match", "Change the search.", "")}
  `);
}

function viewCustomer() {
  const draft = ui.draft;
  if (!draft) return shell("Customer", "", emptyBlock("This customer was not found", "They may have been removed in this preview.", `<a class="btn" href="#/customers">Back to customers</a>`));
  const address = draft.default_address || addr("", "", "", "", "");
  const history = ordersFor(draft.id).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  const rows = history.map((row) => `<li>
    <a href="#/orders/${row.id}">${esc(row.id)}</a>
    <span class="meta">${esc(day(row.created_at))}</span>
    <span class="meta">${statusBadge(row.status)} ${inr(row.subtotal)}</span>
  </li>`).join("");
  return shell(draft.name || "Customer", "", `<form class="workspace" data-form="customer">
    <div class="workspace-main">
      <section class="block">
        <div class="grid">
          ${field("Name", textInput("u-name", "name", draft.name), "", err("name"), true)}
          ${field("Email", textInput("u-email", "email", draft.email, "email"), "Orders match this email at checkout.", err("email"), true)}
          ${field("Phone", textInput("u-phone", "phone", draft.phone, "tel"))}
          ${field("Since", `<input id="u-since" type="text" readonly value="${esc(day(draft.created_at))}">`)}
        </div>
      </section>
      <section class="block">
        <h2>Default address</h2>
        <p class="help">Saving here does not rewrite addresses already stored on past orders.</p>
        <div class="grid">
          ${field("Full name", textInput("u-fn", "default_address.fullName", address.fullName))}
          ${field("Line 1", textInput("u-l1", "default_address.line1", address.line1))}
          ${field("Line 2", textInput("u-l2", "default_address.line2", address.line2))}
          ${field("City", textInput("u-city", "default_address.city", address.city))}
          ${field("State", textInput("u-state", "default_address.state", address.state))}
          ${field("Postal code", textInput("u-pin", "default_address.postalCode", address.postalCode))}
          ${field("Country", textInput("u-country", "default_address.country", address.country))}
        </div>
      </section>
      <div class="btn-row"><button class="btn btn-primary" type="submit">Save customer</button><a class="btn" href="#/customers">Back</a></div>
    </div>
    <aside class="workspace-side">
      <h2>Orders</h2>
      ${history.length ? `<ul class="list-plain">${rows}</ul>` : `<p class="help">No orders yet. Guest checkout will add one when this email buys.</p>`}
    </aside>
  </form>`);
}

function viewEnquiries() {
  const q = ui.filters.enquiries.trim().toLowerCase();
  const rows = db.enquiries.filter((row) => {
    const hay = (row.name + " " + row.email + " " + row.message).toLowerCase();
    if (q && !hay.includes(q)) return false;
    if (ui.filters.enquiryState === "open" && row.handled) return false;
    if (ui.filters.enquiryState === "handled" && !row.handled) return false;
    if (ui.filters.enquiryKind !== "all" && row.kind !== ui.filters.enquiryKind) return false;
    return true;
  }).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  const body = rows.map((row) => `<tr>
    <td>${esc(when(row.created_at))}</td>
    <td>${esc(row.name)}<span class="meta">${esc(row.email)}</span></td>
    <td><span class="badge">${row.kind === "workshop" ? "Workshop" : "Contact"}</span></td>
    <td>${esc(row.message)}</td>
    <td><label class="switch"><input type="checkbox" data-action="toggle-enquiry" data-id="${row.id}" ${row.handled ? "checked" : ""}><span>${row.handled ? "Handled" : "Open"}</span></label></td>
  </tr>`).join("");
  return shell("Enquiries", "", `
    <p class="note">Anyone can submit an enquiry from the shop. Workshop messages are stored here. Booking seminars is not part of v1.</p>
    <div class="filters">
      <label class="search">${icon("search")}<span class="sr">Search enquiries</span>
        <input id="filter-enquiries" type="search" data-filter="enquiries" value="${esc(ui.filters.enquiries)}" placeholder="Search name, email, or message">
      </label>
      <select aria-label="Handled state" data-filter="enquiryState">
        ${options([["all", "Open and handled"], ["open", "Open"], ["handled", "Handled"]], ui.filters.enquiryState)}
      </select>
      <select aria-label="Enquiry kind" data-filter="enquiryKind">
        ${options([["all", "All kinds"], ["contact", "Contact"], ["workshop", "Workshop"]], ui.filters.enquiryKind)}
      </select>
      <span class="count">${rows.length} shown</span>
    </div>
    ${rows.length ? `<div class="table-wrap"><table><thead><tr><th>Received</th><th>From</th><th>Kind</th><th>Message</th><th>Handled</th></tr></thead><tbody>${body}</tbody></table></div>` : emptyBlock("No enquiries match", "Change the filters.", "")}
  `);
}

function purchaseSubnav(active) {
  return `<div class="subnav">
    <a href="#/purchases" class="${active === "bills" ? "active" : ""}">Bills</a>
    <a href="#/suppliers" class="${active === "suppliers" ? "active" : ""}">Suppliers</a>
  </div>`;
}

function viewPurchases() {
  const q = ui.filters.purchases.trim().toLowerCase();
  const rows = db.purchaseInvoices.filter((row) => {
    const supplier = findSupplier(row.supplier_id);
    const hay = (row.bill_no + " " + (supplier ? supplier.name : "")).toLowerCase();
    return !q || hay.includes(q);
  }).sort((a, b) => String(b.bill_date).localeCompare(String(a.bill_date)));
  const body = rows.map((row) => {
    const supplier = findSupplier(row.supplier_id);
    return `<tr>
      <td><a class="rowlink" href="#/purchases/${row.id}">${esc(row.bill_no)}</a></td>
      <td>${esc(day(row.bill_date))}</td>
      <td>${supplier ? esc(supplier.name) : "Supplier removed"}</td>
      <td class="num">${inr(row.total)}</td>
    </tr>`;
  }).join("");
  return shell("Purchases", `<a class="btn btn-primary" href="#/purchases/new">${icon("plus")} New bill</a>`, `
    ${purchaseSubnav("bills")}
    <p class="note">Saving a bill adds quantity to the linked product. Lines without a product, such as thread or fabric, do not change catalog stock. Material stock is not tracked in v1.</p>
    <div class="filters">
      <label class="search">${icon("search")}<span class="sr">Search bills</span>
        <input id="filter-purchases" type="search" data-filter="purchases" value="${esc(ui.filters.purchases)}" placeholder="Search bill number or supplier">
      </label>
      <span class="count">${rows.length} shown</span>
    </div>
    ${rows.length ? `<div class="table-wrap"><table><thead><tr><th>Bill</th><th>Date</th><th>Supplier</th><th class="num">Total</th></tr></thead><tbody>${body}</tbody></table></div>` : emptyBlock("No bills match", "Record a supplier bill to add stock.", `<a class="btn btn-primary" href="#/purchases/new">New bill</a>`)}
  `);
}

function viewPurchaseForm() {
  const route = parseRoute();
  if (route.id !== "new") return viewPurchaseDetail(route.id);
  const draft = ui.draft;
  const supplierOptions = db.suppliers.map((row) => `<option value="${esc(row.id)}" ${row.id === draft.supplier_id ? "selected" : ""}>${esc(row.name)}</option>`).join("");
  const productOptions = [`<option value="">No product (material)</option>`].concat(db.products.map((row) => `<option value="${row.id}">${esc(row.title)} (${row.stock} in stock)</option>`)).join("");
  const lines = draft.lines.map((line, index) => `<div class="line-grid">
      <label class="field"><span>Product</span><select data-bind="lines.${index}.product_id" data-live="total">${productOptions.replace(`value="${esc(line.product_id)}"`, `value="${esc(line.product_id)}" selected`)}</select></label>
      ${field("Description", textInput("line-d-" + index, "lines." + index + ".description", line.description, "text", 'data-live="total"'), "", err("line-" + index + "-description"), true)}
      ${field("Qty", textInput("line-q-" + index, "lines." + index + ".quantity", line.quantity, "number", 'min="1" step="1" data-live="total"'), "", err("line-" + index + "-quantity"), true)}
      ${field("Unit cost", textInput("line-c-" + index, "lines." + index + ".unit_cost", line.unit_cost, "number", 'min="0" step="0.01" data-live="total"'), "", err("line-" + index + "-cost"), true)}
      <button class="btn btn-small btn-danger" type="button" data-action="remove-row" data-list="lines" data-index="${index}">Remove</button>
    </div>`).join("");
  const total = draft.lines.reduce((sum, line) => sum + (Number(line.quantity) || 0) * (Number(line.unit_cost) || 0), 0);
  return shell("New bill", "", `<form class="form-narrow" data-form="bill">
    <section class="block">
      <div class="grid">
        ${field("Supplier", `<select data-bind="supplier_id"><option value="">Choose</option>${supplierOptions}</select>`, err("supplier_id") ? "" : `<a href="#/suppliers/new">Add a supplier</a>`, err("supplier_id"), true)}
        ${field("Bill number", textInput("b-no", "bill_no", draft.bill_no), "The number printed on the supplier's bill.", err("bill_no"), true)}
        ${field("Bill date", textInput("b-date", "bill_date", draft.bill_date, "date"), "", err("bill_date"), true)}
        <div class="span-2">${field("Notes", textArea("b-notes", "notes", draft.notes))}</div>
      </div>
    </section>
    <section class="block">
      <h2>Lines</h2>
      ${err("lines") ? `<p class="err">${esc(err("lines"))}</p>` : ""}
      <div class="bill-lines">${lines}</div>
      <div class="btn-row"><button class="btn" type="button" data-action="add-row" data-list="lines">Add line</button></div>
      <p style="text-align:right;font-weight:700">Total <span id="bill-total">${inr(total)}</span></p>
    </section>
    <div class="btn-row">
      <button class="btn btn-primary" type="submit">Save bill</button>
      <a class="btn" href="#/purchases">Cancel</a>
    </div>
  </form>`);
}

function viewPurchaseDetail(id) {
  const bill = db.purchaseInvoices.find((row) => row.id === id);
  if (!bill) return shell("Bill", "", emptyBlock("This bill was not found", "It may have been removed in this preview.", `<a class="btn" href="#/purchases">Back to bills</a>`));
  const supplier = findSupplier(bill.supplier_id);
  const lines = db.purchaseItems.filter((row) => row.purchase_id === bill.id).map((line) => {
    const productRow = line.product_id ? findProduct(line.product_id) : null;
    return `<tr>
      <td>${esc(line.description)}${productRow ? `<span class="meta">Linked to ${esc(productRow.title)}</span>` : `<span class="meta">Not linked to a product</span>`}</td>
      <td class="num">${line.quantity}</td>
      <td class="num">${inr(line.unit_cost)}</td>
      <td class="num">${inr(line.quantity * line.unit_cost)}</td>
    </tr>`;
  }).join("");
  return shell(bill.bill_no, "", `
    ${purchaseSubnav("bills")}
    <p class="note">Stock was added when this bill was saved. The preview does not edit a saved bill, so stock is not counted twice.</p>
    <div class="grid">
      <p><strong>Supplier</strong><br>${supplier ? esc(supplier.name) : "Supplier removed"}</p>
      <p><strong>Date</strong><br>${esc(day(bill.bill_date))}</p>
      <p><strong>Notes</strong><br>${esc(bill.notes || "None")}</p>
      <p><strong>Recorded</strong><br>${esc(when(bill.created_at))}</p>
    </div>
    <div class="table-wrap" style="margin-top:16px"><table><thead><tr><th>Line</th><th class="num">Qty</th><th class="num">Unit cost</th><th class="num">Amount</th></tr></thead><tbody>${lines}</tbody></table></div>
    <p style="text-align:right;font-weight:700">Total ${inr(bill.total)}</p>
    <p><a href="#/purchases">Back to bills</a></p>
  `);
}

function viewSuppliers() {
  const route = parseRoute();
  if (route.id) return viewSupplierForm();
  const q = ui.filters.suppliers.trim().toLowerCase();
  const rows = db.suppliers.filter((row) => {
    const hay = (row.name + " " + (row.gstin || "") + " " + (row.email || "")).toLowerCase();
    return !q || hay.includes(q);
  });
  const body = rows.map((row) => `<tr>
    <td><a class="rowlink" href="#/suppliers/${row.id}">${esc(row.name)}</a><span class="meta">${esc(row.address || "")}</span></td>
    <td>${esc(row.phone || "")}</td>
    <td>${esc(row.email || "")}</td>
    <td>${esc(row.gstin || "")}</td>
  </tr>`).join("");
  return shell("Suppliers", `<a class="btn btn-primary" href="#/suppliers/new">${icon("plus")} New supplier</a>`, `
    ${purchaseSubnav("suppliers")}
    <div class="filters">
      <label class="search">${icon("search")}<span class="sr">Search suppliers</span>
        <input id="filter-suppliers" type="search" data-filter="suppliers" value="${esc(ui.filters.suppliers)}" placeholder="Search name, email, or GSTIN">
      </label>
      <span class="count">${rows.length} shown</span>
    </div>
    ${rows.length ? `<div class="table-wrap"><table><thead><tr><th>Supplier</th><th>Phone</th><th>Email</th><th>GSTIN</th></tr></thead><tbody>${body}</tbody></table></div>` : emptyBlock("No suppliers match", "Add the mill or thread house you buy from.", `<a class="btn btn-primary" href="#/suppliers/new">New supplier</a>`)}
  `);
}

function viewSupplierForm() {
  const draft = ui.draft;
  if (!draft) return shell("Supplier", "", emptyBlock("This supplier was not found", "They may have been deleted in this preview.", `<a class="btn" href="#/suppliers">Back to suppliers</a>`));
  return shell(draft.id ? draft.name : "New supplier", "", `<form class="form-narrow" data-form="supplier">
    ${purchaseSubnav("suppliers")}
    <div class="grid">
      ${field("Name", textInput("s-name", "name", draft.name), "", err("name"), true)}
      ${field("Phone", textInput("s-phone", "phone", draft.phone, "tel"))}
      ${field("Email", textInput("s-email", "email", draft.email, "email"), "", err("email"))}
      ${field("GSTIN", textInput("s-gstin", "gstin", draft.gstin), "Sample value only. Not validated against a registry.")}
      <div class="span-2">${field("Address", textArea("s-address", "address", draft.address))}</div>
    </div>
    <div class="btn-row">
      <button class="btn btn-primary" type="submit">Save supplier</button>
      <a class="btn" href="#/suppliers">Cancel</a>
      ${draft.id ? `<button class="btn btn-danger" type="button" data-action="ask-delete-supplier">Delete</button>` : ""}
    </div>
  </form>`);
}

function viewSettings() {
  const draft = ui.draft;
  const hero = draft.hero;
  const store = draft.store;
  const social = draft.social;
  const image = hero.backgroundImage;
  const previewStyle = image && image.url ? ` style="background-image:linear-gradient(180deg,rgba(36,20,22,0.15),rgba(36,20,22,0.72)),url('${String(image.url).replace(/'/g, "")}')"` : "";
  return shell("Settings", "", `<form class="workspace" data-form="settings">
    <p class="note">The shop header, footer, contact page, and homepage hero read these fields. Founder story and the rest of the homepage stay in the current content for v1.</p>
    <div class="workspace-main">
      <section class="block">
        <h2>Announcement bar</h2>
        ${field("Text", textInput("set-ann", "announcement", draft.announcement, "text", 'data-preview="announcement"'), "Leave blank to hide the bar on the shop.")}
      </section>
      <section class="block">
        <h2>Homepage hero</h2>
        <div class="grid">
          ${field("Eyebrow", textInput("h-eye", "hero.eyebrow", hero.eyebrow))}
          ${field("Headline", textInput("h-head", "hero.headline", hero.headline, "text", 'data-preview="headline"'), "", err("headline"), true)}
          <div class="span-2">${field("Subheadline", textInput("h-sub", "hero.subheadline", hero.subheadline, "text", 'data-preview="subheadline"'))}</div>
          ${field("Primary button", textInput("h-p", "hero.primaryCtaText", hero.primaryCtaText, "text", 'data-preview="cta"'))}
          ${field("Primary link", textInput("h-pl", "hero.primaryCtaLink", hero.primaryCtaLink, "text"))}
          ${field("Secondary button", textInput("h-s", "hero.secondaryCtaText", hero.secondaryCtaText))}
          ${field("Secondary link", textInput("h-sl", "hero.secondaryCtaLink", hero.secondaryCtaLink))}
        </div>
        <div style="margin-top:12px">
          ${image ? `<article class="image-card"><img src="${esc(image.url)}" alt="${esc(image.altText || "")}">${field("Image alt text", textInput("h-alt", "hero.backgroundImage.altText", image.altText))}</article>` : `<p class="help">No hero image yet.</p>`}
          <label class="btn" style="margin-top:8px">Upload hero image<input class="sr" type="file" accept="image/*" data-action="set-hero-image"></label>
        </div>
      </section>
      <section class="block">
        <h2>Store and contact</h2>
        <div class="grid">
          ${field("Store name", textInput("st-name", "store.name", store.name), "", err("store.name"), true)}
          ${field("Phone", textInput("st-phone", "store.phone", store.phone, "tel"))}
          ${field("Email", textInput("st-email", "store.email", store.email, "email"), "", err("store.email"))}
          ${field("Hours", textInput("st-hours", "store.hours", store.hours))}
          ${field("GSTIN", textInput("st-gstin", "store.gstin", store.gstin), "Printed on sales invoices. Sample value, not a registered number.")}
          <div class="span-2">${field("Address", textArea("st-address", "store.address", store.address))}</div>
        </div>
      </section>
      <section class="block">
        <h2>Social</h2>
        <div class="grid">
          ${field("Instagram", textInput("so-ig", "social.instagram", social.instagram, "url"))}
          ${field("Pinterest", textInput("so-pin", "social.pinterest", social.pinterest, "url"))}
          ${field("WhatsApp", textInput("so-wa", "social.whatsapp", social.whatsapp, "url"))}
        </div>
      </section>
      <p class="help">Last saved ${esc(when(draft.updated_at))}.</p>
      <div class="btn-row">
        <button class="btn btn-primary" type="submit">Save settings</button>
        <button class="btn" type="button" data-action="ask-reset">Reset sample data</button>
      </div>
    </div>
    <aside class="workspace-side">
      <h2>Shop preview</h2>
      <p class="help">Updates as you type. Save writes it for the shop and for invoices.</p>
      <div class="preview-bar" data-preview-target="announcement" data-empty="The bar is hidden when this is empty.">${esc(draft.announcement || "The bar is hidden when this is empty.")}</div>
      <div class="hero-preview"${previewStyle}>
        <h3 data-preview-target="headline">${esc(hero.headline || "Headline")}</h3>
        <p data-preview-target="subheadline">${esc(hero.subheadline || "Subheadline")}</p>
        <span class="btn btn-primary" data-preview-target="cta">${esc(hero.primaryCtaText || "Shop kits")}</span>
      </div>
    </aside>
  </form>`);
}

function pageFor(route) {
  if (!session.authed || route.name === "login") return loginHTML();
  syncQuery(route);
  ensureDraft(route);
  if (route.name === "dashboard") return viewDashboard();
  if (route.name === "products" && route.id) return viewProductForm();
  if (route.name === "products") return viewProducts();
  if (route.name === "collections" && route.id) return viewCollectionForm();
  if (route.name === "collections") return viewCollections();
  if (route.name === "orders" && route.extra === "invoice") return viewInvoice();
  if (route.name === "orders" && route.id) return viewOrder();
  if (route.name === "orders") return viewOrders();
  if (route.name === "customers" && route.id) return viewCustomer();
  if (route.name === "customers") return viewCustomers();
  if (route.name === "enquiries") return viewEnquiries();
  if (route.name === "purchases" && route.id) return viewPurchaseForm();
  if (route.name === "purchases") return viewPurchases();
  if (route.name === "suppliers") return viewSuppliers();
  if (route.name === "settings") return viewSettings();
  return shell("Not found", "", emptyBlock("That page is not in v1", "Use the menu to open catalog, orders, purchases, or settings.", `<a class="btn" href="#/">Dashboard</a>`));
}

function syncQuery(route) {
  if (route.name === "products") ui.filters.productState = route.params.get("state") || "all";
  if (route.name === "orders") ui.filters.orderStatus = route.params.get("status") || "all";
  if (route.name === "enquiries") ui.filters.enquiryState = route.params.get("handled") || "all";
}

function render(opts) {
  const focusId = opts && opts.focus;
  let caret = null;
  if (focusId) {
    const node = document.getElementById(focusId);
    if (node && document.activeElement === node) caret = node.selectionStart;
  }
  const scroller = document.querySelector(".content");
  const scrollTop = scroller ? scroller.scrollTop : 0;
  const route = parseRoute();
  document.title = session.authed ? "Hilo Arte Admin" : "Sign in - Hilo Arte Admin";
  document.getElementById("app").innerHTML = pageFor(route);
  const next = document.querySelector(".content");
  if (next) next.scrollTop = scrollTop;
  if (focusId) {
    const node = document.getElementById(focusId);
    if (node) {
      node.focus();
      if (caret != null && node.setSelectionRange) {
        try { node.setSelectionRange(caret, caret); } catch { /* ignore */ }
      }
    }
  }
}

function bindRoot(node) {
  return ui.draft;
}

function onInput(event) {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;
  if (target.dataset.bind && ui.draft && session.authed) {
    const value = target.type === "checkbox" ? target.checked : target.value;
    setPath(ui.draft, target.dataset.bind, value);
    if (target.dataset.slugSource && !ui.handleTouched) {
      const handle = document.getElementById("f-handle");
      const next = slugify(target.value);
      if (handle) handle.value = next;
      ui.draft.handle = next;
    }
    if (target.id === "f-handle") ui.handleTouched = true;
    if (target.dataset.preview) {
      const node = document.querySelector(`[data-preview-target="${target.dataset.preview}"]`);
      if (node) node.textContent = target.value || node.getAttribute("data-empty") || "";
    }
    if (target.dataset.live === "total") refreshBillTotal();
    return;
  }
  if (target.dataset.checkGroup && ui.draft) {
    const group = target.dataset.checkGroup;
    const boxes = [...document.querySelectorAll(`[data-check-group="${group}"]`)];
    ui.draft[group] = boxes.filter((box) => box.checked).map((box) => box.dataset.value);
    return;
  }
  if (target.dataset.filter != null) {
    ui.filters[target.dataset.filter] = target.value;
    if (target.dataset.filter === "productState") {
      go("#/products" + (target.value === "all" ? "" : "?state=" + encodeURIComponent(target.value)));
      return;
    }
    if (target.dataset.filter === "orderStatus") {
      go("#/orders" + (target.value === "all" ? "" : "?status=" + encodeURIComponent(target.value)));
      return;
    }
    if (target.dataset.filter === "enquiryState") {
      go("#/enquiries" + (target.value === "all" ? "" : "?handled=" + encodeURIComponent(target.value)));
      return;
    }
    render({ focus: target.id });
  }
}

function refreshBillTotal() {
  const el = document.getElementById("bill-total");
  if (!el || !ui.draft || !ui.draft.lines) return;
  const total = ui.draft.lines.reduce((sum, line) => sum + (Number(line.quantity) || 0) * (Number(line.unit_cost) || 0), 0);
  el.textContent = inr(total);
}

function readFiles(fileList) {
  return Promise.all([...fileList].map((file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve({ url: String(reader.result), altText: file.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ") });
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  })));
}

function move(list, index, dir) {
  const next = index + dir;
  if (!list || next < 0 || next >= list.length) return;
  const [row] = list.splice(index, 1);
  list.splice(next, 0, row);
}

function addRow(listName) {
  if (listName === "faqs") ui.draft.faqs.push({ question: "", answer: "" });
  if (listName === "whats_included") ui.draft.whats_included.push("");
  if (listName === "lines") ui.draft.lines.push({ product_id: "", description: "", quantity: 1, unit_cost: "" });
  render();
}

function validEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim());
}

function saveLogin(form) {
  const email = form.querySelector("#login-email").value.trim();
  const password = form.querySelector("#login-password").value;
  if (!validEmail(email) || !password) {
    ui.errors = { login: "Enter an email and a password." };
    render();
    return;
  }
  ui.errors = {};
  session = { authed: true, email };
  saveSession();
  go("#/");
}

function saveProduct() {
  const draft = ui.draft;
  const errors = {};
  if (!String(draft.title).trim()) errors.title = "Enter a title.";
  draft.handle = slugify(draft.handle || draft.title);
  if (!draft.handle) errors.handle = "Enter a handle.";
  const clash = db.products.find((row) => row.handle === draft.handle && row.id !== draft.id);
  if (clash) errors.handle = "Another product already uses this handle.";
  const price = Number(draft.price);
  if (draft.price === "" || Number.isNaN(price) || price < 0) errors.price = "Enter a price of 0 or more.";
  const stock = Number(draft.stock);
  if (draft.stock === "" || !Number.isInteger(stock) || stock < 0) errors.stock = "Enter a whole number of units.";
  ui.errors = errors;
  if (Object.keys(errors).length) { render(); return; }
  const saved = {
    ...draft,
    title: draft.title.trim(),
    subtitle: String(draft.subtitle || "").trim() || null,
    price, stock,
    currency_code: "INR",
    estimated_hours: Number(draft.estimated_hours) || 0,
    tags: draft.tags.map((tag) => tag.trim()).filter(Boolean),
    whats_included: draft.whats_included.map((line) => String(line).trim()).filter(Boolean),
    faqs: draft.faqs.filter((faq) => String(faq.question).trim() || String(faq.answer).trim()),
  };
  if (!saved.id) {
    saved.id = uid("prod");
    saved.created_at = new Date().toISOString();
    db.products.push(saved);
  } else {
    const index = db.products.findIndex((row) => row.id === saved.id);
    db.products[index] = saved;
  }
  saveDB();
  toast(saved.title + " saved.");
  go("#/products/" + saved.id);
}

function saveCollection() {
  const draft = ui.draft;
  const errors = {};
  if (!String(draft.title).trim()) errors.title = "Enter a title.";
  draft.handle = slugify(draft.handle || draft.title);
  if (!draft.handle) errors.handle = "Enter a handle.";
  const clash = db.collections.find((row) => row.handle === draft.handle && row.id !== draft.id);
  if (clash) errors.handle = "Another collection already uses this handle.";
  ui.errors = errors;
  if (Object.keys(errors).length) { render(); return; }
  const previous = draft.id ? findCollection(draft.id) : null;
  const saved = { ...draft, title: draft.title.trim(), sort_order: Number(draft.sort_order) || 0 };
  if (!saved.id) {
    saved.id = uid("col");
    db.collections.push(saved);
  } else {
    const index = db.collections.findIndex((row) => row.id === saved.id);
    db.collections[index] = saved;
    if (previous && previous.handle !== saved.handle) {
      db.products.forEach((row) => {
        row.collections = row.collections.map((handle) => handle === previous.handle ? saved.handle : handle);
      });
    }
  }
  saveDB();
  toast(saved.title + " saved.");
  go("#/collections/" + saved.id);
}

function saveOrder() {
  const draft = ui.draft;
  const errors = {};
  if (!String(draft.customer_name).trim()) errors.customer_name = "Enter a name.";
  if (!validEmail(draft.customer_email)) errors.customer_email = "Enter a valid email.";
  if (!String(draft.shipping_address.line1 || "").trim()) errors.line1 = "Enter address line 1.";
  ui.errors = errors;
  if (Object.keys(errors).length) { render(); return; }
  const previous = findOrder(draft.id);
  const index = db.orders.findIndex((row) => row.id === draft.id);
  db.orders[index] = { ...previous, ...draft, customer_name: draft.customer_name.trim(), customer_email: draft.customer_email.trim() };
  let issued = "";
  if (draft.status === "paid" || draft.status === "shipped" || draft.status === "delivered") {
    if (!invoiceFor(draft.id)) {
      const created = { id: uid("inv"), order_id: draft.id, invoice_no: nextInvoiceNo(), issued_at: new Date().toISOString(), tax_total: 0, total: Number(draft.subtotal) };
      db.invoices.push(created);
      issued = " Invoice " + created.invoice_no + " issued.";
    }
  }
  saveDB();
  toast("Order saved." + issued);
  ui.draftKey = null;
  render();
}

function saveCustomer() {
  const draft = ui.draft;
  const errors = {};
  if (!String(draft.name).trim()) errors.name = "Enter a name.";
  if (!validEmail(draft.email)) errors.email = "Enter a valid email.";
  const clash = db.customers.find((row) => row.email.toLowerCase() === String(draft.email).trim().toLowerCase() && row.id !== draft.id);
  if (clash) errors.email = "Another customer already uses this email.";
  ui.errors = errors;
  if (Object.keys(errors).length) { render(); return; }
  const index = db.customers.findIndex((row) => row.id === draft.id);
  db.customers[index] = { ...draft, name: draft.name.trim(), email: draft.email.trim() };
  saveDB();
  toast("Customer saved. Past orders keep the name and address from checkout.");
  ui.draftKey = null;
  render();
}

function saveSupplier() {
  const draft = ui.draft;
  const errors = {};
  if (!String(draft.name).trim()) errors.name = "Enter a name.";
  if (draft.email && !validEmail(draft.email)) errors.email = "Enter a valid email or leave it blank.";
  ui.errors = errors;
  if (Object.keys(errors).length) { render(); return; }
  const saved = { ...draft, name: draft.name.trim() };
  if (!saved.id) {
    saved.id = uid("sup");
    db.suppliers.push(saved);
  } else {
    const index = db.suppliers.findIndex((row) => row.id === saved.id);
    db.suppliers[index] = saved;
  }
  saveDB();
  toast(saved.name + " saved.");
  go("#/suppliers/" + saved.id);
}

function saveBill() {
  const draft = ui.draft;
  const errors = {};
  if (!draft.supplier_id) errors.supplier_id = "Choose a supplier.";
  if (!String(draft.bill_no).trim()) errors.bill_no = "Enter the bill number.";
  if (!draft.bill_date) errors.bill_date = "Enter the bill date.";
  if (!draft.lines.length) errors.lines = "Add at least one line.";
  draft.lines.forEach((line, index) => {
    if (!String(line.description).trim()) errors["line-" + index + "-description"] = "Enter a description.";
    if (!(Number(line.quantity) > 0)) errors["line-" + index + "-quantity"] = "Quantity must be at least 1.";
    if (line.unit_cost === "" || Number(line.unit_cost) < 0 || Number.isNaN(Number(line.unit_cost))) errors["line-" + index + "-cost"] = "Enter a unit cost.";
  });
  ui.errors = errors;
  if (Object.keys(errors).length) { render(); return; }
  const id = uid("pur");
  const items = draft.lines.map((line) => ({
    id: uid("pi"),
    purchase_id: id,
    product_id: line.product_id || null,
    description: String(line.description).trim(),
    quantity: Math.round(Number(line.quantity)),
    unit_cost: Number(line.unit_cost),
  }));
  const total = items.reduce((sum, line) => sum + line.quantity * line.unit_cost, 0);
  db.purchaseInvoices.push({
    id, supplier_id: draft.supplier_id, bill_no: draft.bill_no.trim(), bill_date: draft.bill_date,
    total, notes: String(draft.notes || "").trim(), created_at: new Date().toISOString(),
  });
  db.purchaseItems.push(...items);
  const notes = [];
  items.forEach((line) => {
    if (!line.product_id) return;
    const productRow = findProduct(line.product_id);
    if (!productRow) return;
    productRow.stock += line.quantity;
    notes.push(productRow.title + " is now " + productRow.stock + " in stock");
  });
  saveDB();
  toast(notes.length ? "Bill saved. " + notes.join(". ") + "." : "Bill saved. No catalog stock changed, because no line is linked to a product.");
  go("#/purchases/" + id);
}

function saveSettings() {
  const draft = ui.draft;
  const errors = {};
  if (!String(draft.hero.headline).trim()) errors.headline = "Enter a headline.";
  if (!String(draft.store.name).trim()) errors["store.name"] = "Enter the store name.";
  if (draft.store.email && !validEmail(draft.store.email)) errors["store.email"] = "Enter a valid email or leave it blank.";
  ui.errors = errors;
  if (Object.keys(errors).length) { render(); return; }
  draft.updated_at = new Date().toISOString();
  db.settings = clone(draft);
  saveDB();
  toast("Settings saved. The shop reads these on the next visit.");
  ui.draftKey = null;
  render();
}

function ask(action, title, body, confirmLabel) {
  ui.modal = { type: "confirm", action, title, body, confirmLabel };
  render();
}

function confirmModal() {
  const action = ui.modal && ui.modal.action;
  ui.modal = null;
  if (action === "delete-product") deleteProduct();
  else if (action === "delete-collection") deleteCollection();
  else if (action === "delete-supplier") deleteSupplier();
  else if (action === "reset") resetData();
  else render();
}

function deleteProduct() {
  const id = ui.draft && ui.draft.id;
  db.products = db.products.filter((row) => row.id !== id);
  db.orderItems.forEach((row) => { if (row.product_id === id) row.product_id = null; });
  db.purchaseItems.forEach((row) => { if (row.product_id === id) row.product_id = null; });
  saveDB();
  toast("Product deleted. Past orders keep the sold title.");
  go("#/products");
}

function deleteCollection() {
  const draft = ui.draft;
  db.collections = db.collections.filter((row) => row.id !== draft.id);
  db.products.forEach((row) => {
    row.collections = row.collections.filter((handle) => handle !== draft.handle);
  });
  saveDB();
  toast("Collection deleted. Products no longer list it.");
  go("#/collections");
}

function deleteSupplier() {
  const id = ui.draft.id;
  const used = db.purchaseInvoices.some((row) => row.supplier_id === id);
  if (used) {
    toast("This supplier has bills, so the record stays. Remove is blocked to keep those bills readable.");
    render();
    return;
  }
  db.suppliers = db.suppliers.filter((row) => row.id !== id);
  saveDB();
  toast("Supplier deleted.");
  go("#/suppliers");
}

function resetData() {
  sessionStorage.removeItem(DB_KEY);
  db = seed();
  ui.draftKey = null;
  toast("Sample data restored.");
  go("#/settings");
}

function onClick(event) {
  const el = event.target.closest("[data-action]");
  if (!el) return;
  const action = el.dataset.action;
  if (action === "open-nav") { ui.navOpen = true; render(); }
  if (action === "close-nav") { ui.navOpen = false; render(); }
  if (action === "sign-out") {
    session = { authed: false };
    saveSession();
    ui.draftKey = null;
    ui.draft = null;
    go("#/login");
  }
  if (action === "toggle-theme") {
    const next = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
    applyTheme(next);
    localStorage.setItem(THEME_KEY, next);
    render();
  }
  if (action === "close-modal") { ui.modal = null; render(); }
  if (action === "confirm-modal") confirmModal();
  if (action === "print") window.print();
  if (action === "sort") {
    const key = el.dataset.key;
    if (ui.sortKey === key) ui.sortDir *= -1;
    else { ui.sortKey = key; ui.sortDir = 1; }
    render();
  }
  if (action === "add-tag") {
    const input = document.getElementById("tag-input");
    const tag = input ? input.value.trim() : "";
    if (tag && !ui.draft.tags.includes(tag)) ui.draft.tags.push(tag);
    if (input) input.value = "";
    render();
  }
  if (action === "remove-tag") {
    ui.draft.tags.splice(Number(el.dataset.index), 1);
    render();
  }
  if (action === "add-row") addRow(el.dataset.list);
  if (action === "remove-row") {
    const list = ui.draft[el.dataset.list];
    list.splice(Number(el.dataset.index), 1);
    render();
  }
  if (action === "move-row") {
    move(ui.draft[el.dataset.list], Number(el.dataset.index), Number(el.dataset.dir));
    render();
  }
  if (action === "clear-collection-image") { ui.draft.image = null; render(); }
  if (action === "ask-delete-product") ask("delete-product", "Delete this product?", "Past orders keep the product name as it was sold. Purchase lines lose the product link.", "Delete product");
  if (action === "ask-delete-collection") ask("delete-collection", "Delete this collection?", "Products that used it will no longer list this category.", "Delete collection");
  if (action === "ask-delete-supplier") ask("delete-supplier", "Delete this supplier?", "This is blocked if the supplier already has a bill.", "Delete supplier");
  if (action === "ask-reset") ask("reset", "Reset sample data?", "Edits in this browser tab, including uploaded images, go back to the original sample.", "Reset data");
}

function onSubmit(event) {
  const form = event.target;
  if (!(form instanceof HTMLFormElement)) return;
  event.preventDefault();
  const kind = form.dataset.form;
  if (kind === "login") saveLogin(form);
  if (kind === "product") saveProduct();
  if (kind === "collection") saveCollection();
  if (kind === "order") saveOrder();
  if (kind === "customer") saveCustomer();
  if (kind === "supplier") saveSupplier();
  if (kind === "bill") saveBill();
  if (kind === "settings") saveSettings();
}

async function onChange(event) {
  const target = event.target;
  if (target instanceof HTMLInputElement && target.dataset.action === "toggle-enquiry") {
    const row = db.enquiries.find((itemRow) => itemRow.id === target.dataset.id);
    if (row) {
      row.handled = target.checked;
      saveDB();
      toast(row.handled ? "Marked handled." : "Marked open.");
      render();
    }
    return;
  }
  if (!(target instanceof HTMLInputElement) || target.type !== "file") return;
  const files = target.files;
  if (!files || !files.length || !ui.draft) return;
  const images = await readFiles(files);
  if (target.dataset.action === "add-images") ui.draft.images.push(...images);
  if (target.dataset.action === "set-collection-image") ui.draft.image = images[0];
  if (target.dataset.action === "set-hero-image") ui.draft.hero.backgroundImage = images[0];
  render();
}

function applyTheme(theme) {
  if (theme === "dark") document.documentElement.setAttribute("data-theme", "dark");
  else document.documentElement.removeAttribute("data-theme");
}

function initTheme() {
  const stored = localStorage.getItem(THEME_KEY);
  if (stored === "dark" || stored === "light") applyTheme(stored);
  else if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) applyTheme("dark");
}

document.addEventListener("click", (event) => {
  const link = event.target.closest("a[href^='#/']");
  if (link) ui.navOpen = false;
});
document.addEventListener("input", onInput);
document.addEventListener("change", (event) => {
  onInput(event);
  onChange(event);
});
document.addEventListener("click", onClick);
document.addEventListener("submit", onSubmit);
document.addEventListener("keydown", (event) => {
  if (event.key !== "Enter" || event.target.id !== "tag-input") return;
  event.preventDefault();
  const tag = event.target.value.trim();
  if (tag && ui.draft && !ui.draft.tags.includes(tag)) ui.draft.tags.push(tag);
  event.target.value = "";
  render();
});
window.addEventListener("hashchange", () => render());

initTheme();
if (!location.hash) location.hash = session.authed ? "#/" : "#/login";
render();
