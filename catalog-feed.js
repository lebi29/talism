/* TALISM managed catalog integration backed by Supabase. */
const SUPABASE_URL = window.TALISM_SUPABASE_URL || "";
const SUPABASE_KEY = window.TALISM_SUPABASE_PUBLISHABLE_KEY || "";
const CATALOG_FEED_URL = SUPABASE_URL ? `${SUPABASE_URL}/rest/v1/products?select=id,name,category,price,description,cover_image_url&is_published=eq.true&order=created_at.desc` : "";

const categoryAliases = {
  "Abayas & Kimonos": ["Abayas & Kimonos", "Stara Clothing"],
  "Elegant Kaftans": ["Elegant Kaftans", "Stara Clothing"],
  "Modest Maxi Dresses": ["Modest Maxi Dresses", "Stara Clothing"],
  "Hijabs & Niqabs": ["Hijabs & Niqabs"],
  "Minimalist Handbags": ["Minimalist Handbags"],
  "Signature Scents": ["Signature Scents"]
};

function addCatalogStyles() {
  if (document.getElementById("talism-managed-catalog-styles")) return;
  const style = document.createElement("style");
  style.id = "talism-managed-catalog-styles";
  style.textContent = `.managed-catalog-section{max-width:1200px;margin:0 auto 64px;padding:0 20px}.managed-catalog-kicker{font-size:10px;letter-spacing:3px;text-transform:uppercase;color:#8b6874;margin-bottom:8px}.managed-catalog-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:14px}.managed-product-card{background:#fffafa;border-radius:14px;overflow:hidden;text-align:left;box-shadow:0 8px 24px #6e51520d}.managed-product-card img{width:100%;height:220px;object-fit:cover;display:block}.managed-product-copy{padding:14px}.managed-product-copy h3{font-family:'Playfair Display',serif;font-size:17px;margin:0 0 6px;color:#222}.managed-product-copy p{font-size:12px;line-height:1.5;color:#65595c;margin:0 0 9px}.managed-product-price{font-size:11px;letter-spacing:1px;color:#8b6874;font-weight:600}.managed-catalog-empty{font-size:13px;color:#76676b;padding:25px 0}@media(max-width:700px){.managed-catalog-grid{grid-template-columns:repeat(2,1fr)}.managed-product-card img{height:180px}}`;
  document.head.appendChild(style);
}

function renderProducts(products, container) {
  const pageCategory = container.dataset.category;
  const allowed = pageCategory && categoryAliases[pageCategory] ? categoryAliases[pageCategory] : null;
  const visible = allowed ? products.filter(product => allowed.includes(product.category)) : products;
  if (!visible.length) { container.innerHTML = "<p class='managed-catalog-empty'>New pieces will appear here as they are published.</p>"; return; }
  container.innerHTML = visible.map(product => `<article class="managed-product-card"><img src="${product.cover_image_url}" alt="${product.name.replace(/"/g, '&quot;')}" loading="lazy"><div class="managed-product-copy"><h3>${product.name}</h3><p>${product.description}</p><span class="managed-product-price">${product.price}</span></div></article>`).join("");
}

async function loadManagedCatalog() {
  const containers = document.querySelectorAll("[data-managed-catalog]");
  if (!containers.length || !CATALOG_FEED_URL || !SUPABASE_KEY) return;
  addCatalogStyles();
  try {
    const response = await fetch(CATALOG_FEED_URL, { headers: { Accept: "application/json", apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } });
    if (!response.ok) throw new Error("Feed unavailable");
    const products = await response.json();
    containers.forEach(container => renderProducts(Array.isArray(products) ? products : [], container));
  } catch (error) {
    console.warn("TALISM managed catalog unavailable; keeping static listings.", error);
  }
}

document.addEventListener("DOMContentLoaded", loadManagedCatalog);
