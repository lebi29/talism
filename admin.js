(() => {
  const client = window.supabase.createClient(window.TALISM_SUPABASE_URL, window.TALISM_SUPABASE_PUBLISHABLE_KEY);
  const $ = id => document.getElementById(id);
  const state = { products: [], editing: null };
  const categories = ['Abayas & Kimonos','Elegant Kaftans','Modest Maxi Dresses','Hijabs & Niqabs','Minimalist Handbags','Signature Scents'];

  function setMessage(text, error = false) { const node = $('form-message'); node.textContent = text; node.className = error ? 'error' : 'message'; }
  function showApp(show) { $('auth-view').classList.toggle('hidden', show); $('app-view').classList.toggle('hidden', !show); }
  function resetForm() { state.editing = null; $('product-form').reset(); $('product-id').value = ''; $('form-title').textContent = 'Add a product'; $('save-label').textContent = 'Save product'; $('cancel-edit').classList.add('hidden'); $('cover-image').required = true; setMessage(''); }

  async function loadProducts() {
    const { data, error } = await client.from('products').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    state.products = data || [];
    renderProducts();
  }

  function renderProducts() {
    const query = $('search').value.trim().toLowerCase();
    const products = state.products.filter(product => !query || `${product.name} ${product.category} ${product.price}`.toLowerCase().includes(query));
    $('product-list').innerHTML = products.length ? products.map(product => `<article class="product-card"><img src="${product.cover_image_url}" alt="${escapeHtml(product.name)}"><div><h3>${escapeHtml(product.name)}</h3><div class="product-meta">${escapeHtml(product.category)} · ${escapeHtml(product.price)}</div><div class="product-status">${product.is_published ? 'Published' : 'Draft'}</div></div><div class="actions"><button data-action="edit" data-id="${product.id}">Edit</button><button data-action="toggle" data-id="${product.id}">${product.is_published ? 'Unpublish' : 'Publish'}</button><button class="danger" data-action="delete" data-id="${product.id}">Remove</button></div></article>`).join('') : '<p class="muted">No catalog pieces yet.</p>';
  }

  function escapeHtml(value) { return String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[char])); }
  function beginEdit(product) { state.editing = product; $('product-id').value = product.id; $('name').value = product.name; $('category').value = categories.includes(product.category) ? product.category : categories[0]; $('price').value = product.price; $('description').value = product.description || ''; $('is-published').checked = product.is_published; $('cover-image').required = false; $('form-title').textContent = 'Edit product'; $('save-label').textContent = 'Update product'; $('cancel-edit').classList.remove('hidden'); window.scrollTo({ top: 0, behavior: 'smooth' }); }

  async function uploadImage(file, id) {
    const extension = file.name.split('.').pop().toLowerCase();
    const path = `${id || crypto.randomUUID()}/${Date.now()}.${extension}`;
    const { error } = await client.storage.from('product-images').upload(path, file, { upsert: false, contentType: file.type });
    if (error) throw error;
    const { data } = client.storage.from('product-images').getPublicUrl(path);
    return { path, url: data.publicUrl };
  }

  $('login-form').addEventListener('submit', async event => { event.preventDefault(); $('login-error').textContent = ''; const { error } = await client.auth.signInWithPassword({ email: $('email').value.trim(), password: $('password').value }); if (error) { $('login-error').textContent = error.message; return; } await start(); });
  $('logout').addEventListener('click', async () => { await client.auth.signOut(); showApp(false); });
  $('search').addEventListener('input', renderProducts);
  $('cancel-edit').addEventListener('click', resetForm);

  $('product-form').addEventListener('submit', async event => {
    event.preventDefault(); setMessage('Saving…');
    try {
      const current = state.editing;
      let image = current ? { path: current.cover_image_path, url: current.cover_image_url } : null;
      const file = $('cover-image').files[0];
      if (file) image = await uploadImage(file, current?.id);
      if (!image) throw new Error('Please choose a cover image.');
      const payload = { name: $('name').value.trim(), category: $('category').value, price: $('price').value.trim(), description: $('description').value.trim(), cover_image_url: image.url, cover_image_path: image.path, is_published: $('is-published').checked };
      const result = current ? await client.from('products').update(payload).eq('id', current.id) : await client.from('products').insert(payload);
      if (result.error) throw result.error;
      setMessage(current ? 'Product updated.' : 'Product added.'); resetForm(); await loadProducts();
    } catch (error) { setMessage(error.message || 'Unable to save product.', true); }
  });

  $('product-list').addEventListener('click', async event => {
    const button = event.target.closest('button[data-action]'); if (!button) return;
    const product = state.products.find(item => item.id === button.dataset.id); if (!product) return;
    try {
      if (button.dataset.action === 'edit') return beginEdit(product);
      if (button.dataset.action === 'toggle') { const { error } = await client.from('products').update({ is_published: !product.is_published }).eq('id', product.id); if (error) throw error; await loadProducts(); }
      if (button.dataset.action === 'delete' && confirm(`Remove ${product.name}?`)) { const { error } = await client.from('products').delete().eq('id', product.id); if (error) throw error; await client.storage.from('product-images').remove([product.cover_image_path]); await loadProducts(); }
    } catch (error) { setMessage(error.message || 'Catalog action failed.', true); }
  });

  async function start() { const { data: { session } } = await client.auth.getSession(); if (!session) return showApp(false); showApp(true); try { await loadProducts(); } catch (error) { setMessage(error.message || 'Unable to load catalog.', true); } }
  client.auth.onAuthStateChange((_event, session) => { if (session) start(); });
  start();
})();
