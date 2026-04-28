// App principal: orquesta cliente vs admin

const DEFAULT_EMPRESA = {
  nombre: 'Vidrios y Aluminio El Castillo',
  giro: 'Distribución de vidrios y perfiles de aluminio',
  direccion: 'Tu dirección · Ciudad, Estado',
  telefono: '+52 55 0000 0000',
  whatsapp: '+52 55 0000 0000',
};

const App = () => {
  const [mode, setMode] = React.useState('cliente'); // cliente | admin
  const [phase, setPhase] = React.useState('catalog'); // catalog | checkout
  const [cart, setCart] = React.useState([]);
  const [catalog, setCatalog] = React.useState(() => {
    try {
      const saved = localStorage.getItem('catalog');
      if (saved) return JSON.parse(saved);
    } catch(e) {}
    return window.CATALOG_DATA;
  });
  const [empresa, setEmpresa] = React.useState(() => {
    try {
      const saved = localStorage.getItem('empresa');
      if (saved) return JSON.parse(saved);
    } catch(e) {}
    return DEFAULT_EMPRESA;
  });

  const addToCart = (producto, cantidad) => {
    setCart(cart => {
      const existing = cart.find(i => i.codigo === producto.codigo);
      if (existing) {
        return cart.map(i => i.codigo === producto.codigo ? {...i, cantidad: Math.min(producto.stock, i.cantidad + cantidad)} : i);
      }
      return [...cart, {...producto, cantidad}];
    });
    // brief toast feedback
    const el = document.createElement('div');
    el.className = 'toast';
    el.textContent = `✓ ${producto.descripcion} agregado`;
    document.body.appendChild(el);
    setTimeout(() => el.classList.add('show'), 10);
    setTimeout(() => { el.classList.remove('show'); setTimeout(() => el.remove(), 300); }, 2200);
  };

  const removeFromCart = (codigo) => setCart(cart => cart.filter(i => i.codigo !== codigo));
  const updateQty = (codigo, qty) => setCart(cart => cart.map(i => i.codigo === codigo ? {...i, cantidad: qty} : i));

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand-mark">
          <div className="logo-mark">
            <svg viewBox="0 0 60 60" width="36" height="36" fill="none">
              <rect x="6" y="6" width="48" height="48" rx="3" stroke="#0F3D6E" strokeWidth="3" fill="#E8F0F7"/>
              <line x1="6" y1="30" x2="54" y2="30" stroke="#0F3D6E" strokeWidth="2"/>
              <line x1="30" y1="6" x2="30" y2="54" stroke="#0F3D6E" strokeWidth="2"/>
              <polygon points="6,6 30,30 6,30" fill="#0F3D6E" opacity="0.18"/>
            </svg>
          </div>
          <div className="brand-text">
            <div className="brand-name">{empresa.nombre}</div>
            <div className="brand-sub">Cotizador en línea</div>
          </div>
        </div>
        <div className="mode-toggle">
          <button className={mode === 'cliente' ? 'active' : ''} onClick={() => { setMode('cliente'); setPhase('catalog'); }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><circle cx="12" cy="7" r="4"/><path d="M5.5 21a6.5 6.5 0 0 1 13 0"/></svg>
            Vista cliente
          </button>
          <button className={mode === 'admin' ? 'active' : ''} onClick={() => setMode('admin')}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M12 2l3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z"/></svg>
            Panel admin
          </button>
        </div>
      </header>

      <main>
        {mode === 'cliente' && phase === 'catalog' && (
          <CatalogView
            catalog={catalog}
            cart={cart}
            addToCart={addToCart}
            removeFromCart={removeFromCart}
            updateQty={updateQty}
            onCheckout={() => setPhase('checkout')}
          />
        )}
        {mode === 'cliente' && phase === 'checkout' && (
          <CheckoutFlow
            cart={cart}
            empresa={empresa}
            onBack={() => setPhase('catalog')}
            onComplete={() => { setCart([]); setPhase('catalog'); }}
          />
        )}
        {mode === 'admin' && (
          <AdminPanel
            catalog={catalog}
            setCatalog={setCatalog}
            empresa={empresa}
            setEmpresa={setEmpresa}
          />
        )}
      </main>

      <footer className="appfoot">
        <span>{empresa.nombre} · Sistema de pre‑cotizaciones · Demo</span>
        <span>{catalog.length} productos · {catalog.filter(p => p.stock > 0).length} con stock</span>
      </footer>
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
