(() => {
  const client = window.supabase.createClient(window.TALISM_SUPABASE_URL, window.TALISM_SUPABASE_PUBLISHABLE_KEY);
  const $ = id => document.getElementById(id);
  const state = { products: [] };
  const escapeHtml = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[char]));
  const setMessage = (text, error = false) => { $('page-message').textContent = text; $('page-message').className = error ? 'error' : 'message'; };
  const showApp = show => { $('auth-view').classList.toggle('hidden', show); $('app-view').classList.toggle('hidden', !show); };

  function render() {
    const search = $('search').value.trim().toLowerCase();
    const status = $('status-filter').value;
    const products = state.products.filter(product => {
      const matchesSearch = !search || `${product.name} ${product.category} ${product.price}`.toLowerCase().includes(search);
      const matchesStatus = status === 'all' || (status === 'published' ? product.is_published : !product.is_published);
      return matchesSearch && matchesStatus;
    });
    $('count').textContent = `${products.length} ${products.length === 1 ? 'piece' : 'pieces'}`;
    $('product-list').innerHTML = products.length ? products.map(product => `<article class="archive-card"><img src="${product.cover_image_url}" alt="${escapeHtml(product.name)}" loading="lazy"><div class="archive-copy"><div class="product-status">${product.is_published ? 'Published' : 'Draft'}</div><h2>${escapeHtml(product.name)}</h2><p>${escapeHtml(product.category)}</p><strong>${escapeHtml(product.price)}</strong></div><button class="delete-button" data-id="${product.id}" aria-label="Delete ${escapeHtml(product.name)}">Delete</button></article>`).join('') : '<p class="muted empty-catalog">No matching products in the catalog.</p>';
  }

  async function loadProducts() { const { data, error } = await client.from('products').select('*').order('created_at', { ascending: false }); if (error) throw error; state.products = data || []; render(); }
  async function start() { const { data: { session } } = await client.auth.getSession(); if (!session) return showApp(false); showApp(true); try { await loadProducts(); } catch (error) { setMessage(error.message || 'Unable to load catalog.', true); } }

  $('login-form').addEventListener('submit', async event => { event.preventDefault(); $('login-error').textContent = ''; const { error } = await client.auth.signInWithPassword({ email: $('email').value.trim(), password: $('password').value }); if (error) return $('login-error').textContent = error.message; await start(); });
  $('logout').addEventListener('click', async () => { await client.auth.signOut(); showApp(false); });
  $('search').addEventListener('input', render); $('status-filter').addEventListener('change', render);
  $('product-list').addEventListener('click', async event => { const button = event.target.closest('.delete-button'); if (!button) return; const product = state.products.find(item => item.id === button.dataset.id); if (!product || !confirm(`Delete “${product.name}” permanently?`)) return; setMessage('Deleting…'); const { error } = await client.from('products').delete().eq('id', product.id); if (error) return setMessage(error.message, true); if (product.cover_image_path) await client.storage.from('product-images').remove([product.cover_image_path]); state.products = state.products.filter(item => item.id !== product.id); render(); setMessage('Product deleted.'); });
  client.auth.onAuthStateChange((_event, session) => { if (session) start(); }); start();
})();
