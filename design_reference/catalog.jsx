// Vista cliente: catálogo + búsqueda + carrito + lightbox

const formatMoney = (n) => `$${n.toLocaleString('es-MX', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;

// Fuzzy search — Levenshtein-based scoring
const fuzzyScore = (query, text) => {
  if (!query) return 1;
  const q = query.toLowerCase().trim();
  const t = text.toLowerCase();
  if (t.includes(q)) return 100 - (t.indexOf(q) * 0.1);
  // token-level
  const qTokens = q.split(/\s+/);
  let score = 0;
  for (const tok of qTokens) {
    if (tok.length < 2) continue;
    if (t.includes(tok)) { score += 50; continue; }
    // prefix match
    for (const word of t.split(/\s+/)) {
      if (word.startsWith(tok.slice(0, Math.max(2, tok.length - 1)))) { score += 20; break; }
      // levenshtein <= 2
      if (Math.abs(word.length - tok.length) <= 2 && lev(word, tok) <= 2) { score += 15; break; }
    }
  }
  return score;
};

const lev = (a, b) => {
  if (a === b) return 0;
  const m = a.length, n = b.length;
  if (!m) return n; if (!n) return m;
  const dp = Array.from({length: m+1}, () => new Array(n+1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++) {
    dp[i][j] = a[i-1] === b[j-1] ? dp[i-1][j-1] : 1 + Math.min(dp[i-1][j-1], dp[i-1][j], dp[i][j-1]);
  }
  return dp[m][n];
};

const ProductCard = ({ producto, onZoom, onAdd, qty, onQty }) => {
  const lowStock = producto.stock <= 5;
  return (
    <div className="card">
      <div className="card-img" onClick={() => onZoom(producto)} title="Clic para ampliar">
        <GlassRender producto={producto} size="sm" />
        <div className="zoom-hint">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
        </div>
      </div>
      <div className="card-body">
        <div className="card-code">#{producto.codigo}</div>
        <div className="card-title">{producto.descripcion}</div>
        <div className="card-meta">
          <span className="chip">{producto.categoria}</span>
          <span className="dim">{producto.dimensiones}</span>
        </div>
        <div className="card-foot">
          <div>
            <div className="price">{formatMoney(producto.precio)}</div>
            <div className={"stock " + (lowStock ? "low" : "")}>
              <span className="stock-dot"></span>
              {lowStock ? `Quedan ${producto.stock}` : `${producto.stock} disp.`} <span className="unit">/ {producto.unidad}</span>
            </div>
          </div>
          <div className="qty-add">
            <div className="qty">
              <button onClick={() => onQty(Math.max(1, qty - 1))} aria-label="menos">−</button>
              <input type="number" value={qty} min="1" max={producto.stock} onChange={e => onQty(Math.max(1, Math.min(producto.stock, +e.target.value || 1)))} />
              <button onClick={() => onQty(Math.min(producto.stock, qty + 1))} aria-label="más">+</button>
            </div>
            <button className="btn-add" onClick={() => onAdd(producto, qty)}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Agregar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const CatalogView = ({ catalog, cart, addToCart, removeFromCart, updateQty, onCheckout }) => {
  const [query, setQuery] = React.useState('');
  const [activeCat, setActiveCat] = React.useState('Todos');
  const [zoomProduct, setZoomProduct] = React.useState(null);
  const [qtyMap, setQtyMap] = React.useState({});
  const [view, setView] = React.useState('grid'); // 'grid' | 'list'
  const [showCart, setShowCart] = React.useState(false);

  const inStock = catalog.filter(p => p.stock > 0);
  const categorias = ['Todos', ...new Set(inStock.map(p => p.categoria))];

  const filtered = React.useMemo(() => {
    let list = inStock;
    if (activeCat !== 'Todos') list = list.filter(p => p.categoria === activeCat);
    if (query.trim()) {
      list = list.map(p => {
        const haystack = `${p.codigo} ${p.descripcion} ${p.categoria} ${p.dimensiones}`;
        return { p, score: fuzzyScore(query, haystack) };
      }).filter(x => x.score > 10).sort((a,b) => b.score - a.score).map(x => x.p);
    }
    return list;
  }, [query, activeCat, inStock]);

  // Suggestions
  const suggestions = React.useMemo(() => {
    if (!query.trim() || query.length < 2) return [];
    const all = inStock.map(p => p.descripcion);
    const uniq = [...new Set(all)];
    return uniq.map(d => ({ d, score: fuzzyScore(query, d) }))
      .filter(x => x.score > 15)
      .sort((a,b) => b.score - a.score)
      .slice(0, 5)
      .map(x => x.d);
  }, [query, inStock]);

  const cartTotal = cart.reduce((s, item) => s + item.precio * item.cantidad, 0);
  const cartCount = cart.reduce((s, item) => s + item.cantidad, 0);

  const groupedByCategory = React.useMemo(() => {
    const groups = {};
    for (const p of filtered) {
      if (!groups[p.categoria]) groups[p.categoria] = [];
      groups[p.categoria].push(p);
    }
    return groups;
  }, [filtered]);

  return (
    <div className="catalog-view">
      <div className="catalog-hero">
        <div className="hero-text">
          <h1>Cotizador en línea</h1>
          <p>Selecciona los productos que necesitas y nosotros validamos disponibilidad y te enviamos cotización formal.</p>
        </div>
        <div className="search-box">
          <svg className="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input
            placeholder="Buscar por código, material o medidas (ej: espejo, 76101, filtrasol)..."
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          {query && <button className="clear-btn" onClick={() => setQuery('')}>×</button>}
          {suggestions.length > 0 && query && (
            <div className="suggestions">
              {suggestions.map(s => (
                <div key={s} className="suggestion" onClick={() => setQuery(s)}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
                  {s}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="catalog-bar">
        <div className="cats">
          {categorias.map(c => (
            <button
              key={c}
              className={"cat-pill " + (activeCat === c ? "active" : "")}
              onClick={() => setActiveCat(c)}
            >
              {c}
              {c !== 'Todos' && <span className="cat-count">{inStock.filter(p => p.categoria === c).length}</span>}
            </button>
          ))}
        </div>
        <div className="view-toggle">
          <button className={view === 'grid' ? 'active' : ''} onClick={() => setView('grid')} title="Vista en mosaico">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
            Mosaico
          </button>
          <button className={view === 'list' ? 'active' : ''} onClick={() => setView('list')} title="Vista en lista">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
            Lista
          </button>
        </div>
      </div>

      {filtered.length === 0 && (
        <div className="empty">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <p>No encontramos productos para "<strong>{query}</strong>"</p>
          <button onClick={() => setQuery('')}>Limpiar búsqueda</button>
        </div>
      )}

      {view === 'grid' ? (
        <div className="results-info">
          {query ? <span><strong>{filtered.length}</strong> resultados para "<em>{query}</em>"</span> : <span><strong>{filtered.length}</strong> productos disponibles</span>}
        </div>
      ) : null}

      {view === 'grid' ? (
        <div className="grid">
          {filtered.map(p => (
            <ProductCard
              key={p.codigo}
              producto={p}
              qty={qtyMap[p.codigo] || 1}
              onQty={(q) => setQtyMap({...qtyMap, [p.codigo]: q})}
              onZoom={setZoomProduct}
              onAdd={(prod, q) => {
                addToCart(prod, q);
                setQtyMap({...qtyMap, [p.codigo]: 1});
              }}
            />
          ))}
        </div>
      ) : (
        <ListView
          grouped={groupedByCategory}
          query={query}
          qtyMap={qtyMap}
          setQtyMap={setQtyMap}
          onZoom={setZoomProduct}
          onAdd={(prod, q) => {
            addToCart(prod, q);
            setQtyMap({...qtyMap, [prod.codigo]: 1});
          }}
        />
      )}

      {/* Floating cart button */}
      {cart.length > 0 && (
        <button className="cart-fab" onClick={() => setShowCart(true)}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
          <span className="cart-count-badge">{cartCount}</span>
          <span className="cart-fab-total">{formatMoney(cartTotal)}</span>
          <span className="cart-fab-cta">Ver pre‑cotización →</span>
        </button>
      )}

      {/* Cart drawer */}
      {showCart && (
        <CartDrawer
          cart={cart}
          onClose={() => setShowCart(false)}
          onRemove={removeFromCart}
          onUpdateQty={updateQty}
          onCheckout={() => { setShowCart(false); onCheckout(); }}
        />
      )}

      {/* Zoom lightbox */}
      {zoomProduct && (
        <Lightbox producto={zoomProduct} onClose={() => setZoomProduct(null)} />
      )}
    </div>
  );
};

const ListView = ({ grouped, query, qtyMap, setQtyMap, onZoom, onAdd }) => {
  return (
    <div className="list-view">
      {Object.entries(grouped).map(([cat, items]) => (
        <div key={cat} className="list-group">
          <div className="list-group-header">
            <h3>{cat}</h3>
            <span>{items.length} productos</span>
          </div>
          <div className="list-table">
            <div className="list-row list-head">
              <div className="cell-img"></div>
              <div className="cell-code">Código</div>
              <div className="cell-desc">Descripción</div>
              <div className="cell-dim">Dimensiones</div>
              <div className="cell-stock">Stock</div>
              <div className="cell-price">Precio</div>
              <div className="cell-actions"></div>
            </div>
            {items.map(p => (
              <div key={p.codigo} className="list-row">
                <div className="cell-img" onClick={() => onZoom(p)}>
                  <GlassRender producto={p} size="sm" />
                </div>
                <div className="cell-code">#{p.codigo}</div>
                <div className="cell-desc">{p.descripcion}</div>
                <div className="cell-dim">{p.dimensiones}</div>
                <div className="cell-stock">
                  <span className={"stock " + (p.stock <= 5 ? "low" : "")}>
                    <span className="stock-dot"></span>
                    {p.stock}
                  </span>
                </div>
                <div className="cell-price">{formatMoney(p.precio)}</div>
                <div className="cell-actions">
                  <div className="qty mini">
                    <button onClick={() => setQtyMap({...qtyMap, [p.codigo]: Math.max(1, (qtyMap[p.codigo] || 1) - 1)})}>−</button>
                    <span>{qtyMap[p.codigo] || 1}</span>
                    <button onClick={() => setQtyMap({...qtyMap, [p.codigo]: Math.min(p.stock, (qtyMap[p.codigo] || 1) + 1)})}>+</button>
                  </div>
                  <button className="btn-add" onClick={() => onAdd(p, qtyMap[p.codigo] || 1)}>Agregar</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

const Lightbox = ({ producto, onClose }) => {
  React.useEffect(() => {
    const onKey = e => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  return (
    <div className="lightbox" onClick={onClose}>
      <div className="lightbox-inner" onClick={e => e.stopPropagation()}>
        <button className="lightbox-close" onClick={onClose}>×</button>
        <div className="lightbox-img">
          <GlassRender producto={producto} size="lg" />
        </div>
        <div className="lightbox-info">
          <div className="lb-code">#{producto.codigo}</div>
          <h2>{producto.descripcion}</h2>
          <div className="lb-cat">{producto.categoria}</div>
          <div className="lb-grid">
            <div><label>Dimensiones</label><div>{producto.dimensiones}</div></div>
            <div><label>Precio</label><div className="lb-price">{formatMoney(producto.precio)}</div></div>
            <div><label>Disponible</label><div>{producto.stock} {producto.unidad}s</div></div>
            <div><label>Unidad</label><div>{producto.unidad}</div></div>
          </div>
          <p className="lb-note">Render referencial. Las propiedades visuales reales del material pueden variar ligeramente.</p>
        </div>
      </div>
    </div>
  );
};

const CartDrawer = ({ cart, onClose, onRemove, onUpdateQty, onCheckout }) => {
  const subtotal = cart.reduce((s, i) => s + i.precio * i.cantidad, 0);
  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div className="drawer" onClick={e => e.stopPropagation()}>
        <div className="drawer-head">
          <h2>Tu pre‑cotización</h2>
          <button onClick={onClose}>×</button>
        </div>
        <div className="drawer-body">
          {cart.length === 0 ? (
            <p className="empty-cart">Aún no agregas productos.</p>
          ) : cart.map(item => (
            <div key={item.codigo} className="cart-item">
              <div className="cart-item-img"><GlassRender producto={item} size="sm" /></div>
              <div className="cart-item-info">
                <div className="cart-item-code">#{item.codigo}</div>
                <div className="cart-item-name">{item.descripcion}</div>
                <div className="cart-item-dim">{item.dimensiones}</div>
                <div className="cart-item-price">{formatMoney(item.precio)} <span>/ {item.unidad}</span></div>
              </div>
              <div className="cart-item-actions">
                <div className="qty mini">
                  <button onClick={() => onUpdateQty(item.codigo, Math.max(1, item.cantidad - 1))}>−</button>
                  <span>{item.cantidad}</span>
                  <button onClick={() => onUpdateQty(item.codigo, Math.min(item.stock, item.cantidad + 1))}>+</button>
                </div>
                <div className="cart-item-total">{formatMoney(item.precio * item.cantidad)}</div>
                <button className="link-danger" onClick={() => onRemove(item.codigo)}>Eliminar</button>
              </div>
            </div>
          ))}
        </div>
        {cart.length > 0 && (
          <div className="drawer-foot">
            <div className="row"><span>Subtotal estimado</span><strong>{formatMoney(subtotal)}</strong></div>
            <p className="disclaimer">Esta es una <strong>pre‑cotización</strong>. Personal de ventas validará disponibilidad y precios finales antes de enviarte la cotización oficial.</p>
            <button className="btn-primary big" onClick={onCheckout}>
              Continuar a datos de contacto
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

window.CatalogView = CatalogView;
window.formatMoney = formatMoney;
