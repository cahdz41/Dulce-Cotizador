// Panel admin: ver pre-cotizaciones, cargar Excel

const AdminPanel = ({ catalog, setCatalog, empresa, setEmpresa }) => {
  const [tab, setTab] = React.useState('cotizaciones');
  const [quotes, setQuotes] = React.useState(() => {
    try { return JSON.parse(localStorage.getItem('quotes') || '[]'); } catch(e) { return []; }
  });
  const [selected, setSelected] = React.useState(null);
  const [uploadStatus, setUploadStatus] = React.useState(null);

  React.useEffect(() => {
    const interval = setInterval(() => {
      try { setQuotes(JSON.parse(localStorage.getItem('quotes') || '[]')); } catch(e){}
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  const updateQuoteStatus = (folio, estado) => {
    const updated = quotes.map(q => q.folio === folio ? {...q, estado} : q);
    setQuotes(updated);
    localStorage.setItem('quotes', JSON.stringify(updated));
    if (selected && selected.folio === folio) setSelected({...selected, estado});
  };

  const deleteQuote = (folio) => {
    if (!confirm('¿Eliminar esta cotización?')) return;
    const updated = quotes.filter(q => q.folio !== folio);
    setQuotes(updated);
    localStorage.setItem('quotes', JSON.stringify(updated));
    if (selected && selected.folio === folio) setSelected(null);
  };

  const handleExcelUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadStatus({ type: 'loading', msg: 'Procesando ' + file.name + '...' });
    try {
      const buf = await file.arrayBuffer();
      const products = await parseExcel(buf);
      if (products.length === 0) throw new Error('No se encontraron productos. Revisa que el archivo tenga columnas: Código, Categoría, Descripción, Dimensiones, Precio.');
      setCatalog(products);
      localStorage.setItem('catalog', JSON.stringify(products));
      setUploadStatus({ type: 'success', msg: `✓ ${products.length} productos cargados correctamente` });
      setTimeout(() => setUploadStatus(null), 4000);
    } catch (err) {
      setUploadStatus({ type: 'error', msg: 'Error: ' + err.message });
    }
  };

  const totalPendientes = quotes.filter(q => q.estado === 'pendiente').length;
  const totalAtendidas = quotes.filter(q => q.estado === 'atendida').length;
  const totalRevenue = quotes.filter(q => q.estado === 'atendida').reduce((s, q) => s + (q.total || 0), 0);

  return (
    <div className="admin">
      <div className="admin-head">
        <h1>Panel de administración</h1>
        <p>Gestiona pre‑cotizaciones recibidas y mantén actualizado tu catálogo.</p>
      </div>

      <div className="admin-stats">
        <div className="stat">
          <div className="stat-num">{quotes.length}</div>
          <div className="stat-label">Cotizaciones totales</div>
        </div>
        <div className="stat highlight">
          <div className="stat-num">{totalPendientes}</div>
          <div className="stat-label">Pendientes de atender</div>
        </div>
        <div className="stat">
          <div className="stat-num">{totalAtendidas}</div>
          <div className="stat-label">Atendidas</div>
        </div>
        <div className="stat">
          <div className="stat-num">{catalog.length}</div>
          <div className="stat-label">Productos en catálogo</div>
        </div>
        <div className="stat">
          <div className="stat-num">{formatMoney(totalRevenue).replace('.00','')}</div>
          <div className="stat-label">Cotizado (atendido)</div>
        </div>
      </div>

      <div className="admin-tabs">
        <button className={tab === 'cotizaciones' ? 'active' : ''} onClick={() => setTab('cotizaciones')}>
          Pre‑cotizaciones {totalPendientes > 0 && <span className="badge">{totalPendientes}</span>}
        </button>
        <button className={tab === 'catalogo' ? 'active' : ''} onClick={() => setTab('catalogo')}>Catálogo</button>
        <button className={tab === 'empresa' ? 'active' : ''} onClick={() => setTab('empresa')}>Datos de empresa</button>
      </div>

      {tab === 'cotizaciones' && (
        <div className="admin-quotes">
          {quotes.length === 0 ? (
            <div className="empty-state">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              <h3>Aún no hay pre‑cotizaciones</h3>
              <p>Cuando un cliente complete una pre‑cotización desde el catálogo, aparecerá aquí.</p>
            </div>
          ) : (
            <div className="quotes-layout">
              <div className="quotes-list">
                {quotes.map(q => (
                  <div
                    key={q.folio}
                    className={"quote-row " + (selected?.folio === q.folio ? 'selected' : '') + " " + q.estado}
                    onClick={() => setSelected(q)}
                  >
                    <div className="quote-row-head">
                      <span className="quote-folio">{q.folio}</span>
                      <span className={"quote-status " + q.estado}>{q.estado}</span>
                    </div>
                    <div className="quote-row-name">{q.datos.nombre}</div>
                    <div className="quote-row-meta">
                      <span>{q.cart.length} productos</span>
                      <span>·</span>
                      <span>{formatMoney(q.total)}</span>
                    </div>
                    <div className="quote-row-date">{new Date(q.fecha).toLocaleString('es-MX', {dateStyle: 'short', timeStyle: 'short'})}</div>
                  </div>
                ))}
              </div>
              <div className="quotes-detail">
                {selected ? (
                  <QuoteDetail
                    quote={selected}
                    empresa={empresa}
                    onUpdateStatus={updateQuoteStatus}
                    onDelete={deleteQuote}
                  />
                ) : (
                  <div className="empty-detail">
                    <p>Selecciona una pre‑cotización para ver los detalles</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'catalogo' && (
        <div className="admin-catalog">
          <div className="upload-zone">
            <h3>Cargar/actualizar catálogo desde Excel</h3>
            <p>Sube tu archivo .xlsx con columnas: <code>Código, Categoría, Descripción, Dimensiones, Precio</code> (y opcionalmente <code>Stock</code>).</p>
            <label className="upload-btn">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              Seleccionar archivo .xlsx
              <input type="file" accept=".xlsx" onChange={handleExcelUpload} style={{display: 'none'}} />
            </label>
            {uploadStatus && (
              <div className={"upload-status " + uploadStatus.type}>
                {uploadStatus.msg}
              </div>
            )}
            <button className="link-btn" onClick={() => {
              if (!confirm('¿Restaurar el catálogo precargado original?')) return;
              localStorage.removeItem('catalog');
              setCatalog(window.CATALOG_DATA);
            }}>Restaurar catálogo precargado</button>
          </div>
          <div className="catalog-summary">
            <h4>Resumen actual</h4>
            <div className="summary-grid">
              {[...new Set(catalog.map(p => p.categoria))].map(cat => {
                const items = catalog.filter(p => p.categoria === cat);
                const stock = items.filter(p => p.stock > 0).length;
                return (
                  <div key={cat} className="cat-summary">
                    <div className="cs-name">{cat}</div>
                    <div className="cs-stat">{items.length} productos · {stock} con stock</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {tab === 'empresa' && (
        <div className="admin-empresa">
          <h3>Información de la empresa</h3>
          <p>Estos datos aparecerán en el PDF de cotización y en el mensaje de WhatsApp.</p>
          <div className="field">
            <label>Nombre de la empresa</label>
            <input value={empresa.nombre} onChange={e => setEmpresa({...empresa, nombre: e.target.value})} />
          </div>
          <div className="field">
            <label>Giro / actividad</label>
            <input value={empresa.giro} onChange={e => setEmpresa({...empresa, giro: e.target.value})} />
          </div>
          <div className="field">
            <label>Dirección</label>
            <input value={empresa.direccion} onChange={e => setEmpresa({...empresa, direccion: e.target.value})} />
          </div>
          <div className="field-row">
            <div className="field">
              <label>Teléfono</label>
              <input value={empresa.telefono} onChange={e => setEmpresa({...empresa, telefono: e.target.value})} />
            </div>
            <div className="field">
              <label>WhatsApp (con LADA)</label>
              <input value={empresa.whatsapp} onChange={e => setEmpresa({...empresa, whatsapp: e.target.value})} placeholder="+52 55 1234 5678" />
            </div>
          </div>
          <button className="btn-primary" onClick={() => {
            localStorage.setItem('empresa', JSON.stringify(empresa));
            alert('Datos guardados ✓');
          }}>Guardar datos</button>
        </div>
      )}
    </div>
  );
};

const QuoteDetail = ({ quote, empresa, onUpdateStatus, onDelete }) => {
  const phone = quote.datos.telefono.replace(/\D/g, '');
  return (
    <div className="quote-detail">
      <div className="qd-head">
        <div>
          <div className="qd-folio">{quote.folio}</div>
          <h2>{quote.datos.nombre}</h2>
          <div className="qd-meta">{new Date(quote.fecha).toLocaleString('es-MX')}</div>
        </div>
        <div className="qd-actions-head">
          <span className={"quote-status " + quote.estado}>{quote.estado}</span>
        </div>
      </div>

      <div className="qd-contact">
        <a href={`https://wa.me/${phone}`} target="_blank" className="contact-btn whatsapp">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0 0 20.465 3.488"/></svg>
          {quote.datos.telefono}
        </a>
        {quote.datos.email && <a href={`mailto:${quote.datos.email}`} className="contact-btn">{quote.datos.email}</a>}
        {quote.datos.direccion && <span className="contact-btn">📍 {quote.datos.direccion}</span>}
      </div>

      <div className="qd-products">
        <h4>Productos solicitados ({quote.cart.length})</h4>
        <table className="qd-table">
          <thead><tr><th>Código</th><th>Descripción</th><th>Dim.</th><th>Cant.</th><th>Subtotal</th></tr></thead>
          <tbody>
            {quote.cart.map(i => (
              <tr key={i.codigo}>
                <td className="mono">{i.codigo}</td>
                <td>{i.descripcion}<br/><small>{i.categoria}</small></td>
                <td>{i.dimensiones}</td>
                <td>{i.cantidad}</td>
                <td>{formatMoney(i.precio * i.cantidad)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot><tr><td colSpan="4">Total estimado</td><td><strong>{formatMoney(quote.total)}</strong></td></tr></tfoot>
        </table>
      </div>

      {quote.datos.notas && (
        <div className="qd-notes">
          <h4>Notas del cliente</h4>
          <p>{quote.datos.notas}</p>
        </div>
      )}

      <div className="qd-actions">
        {quote.estado === 'pendiente' && (
          <button className="btn-primary" onClick={() => onUpdateStatus(quote.folio, 'atendida')}>
            ✓ Marcar como atendida
          </button>
        )}
        {quote.estado === 'atendida' && (
          <button className="btn-secondary" onClick={() => onUpdateStatus(quote.folio, 'pendiente')}>
            Reabrir
          </button>
        )}
        <button className="btn-secondary" onClick={() => generatePDF(quote.cart, quote.datos, empresa, quote.folio)}>
          Descargar PDF
        </button>
        <button className="link-danger" onClick={() => onDelete(quote.folio)}>Eliminar</button>
      </div>
    </div>
  );
};

// Excel parser (XLSX in browser)
const parseExcel = async (buf) => {
  // Load JSZip if not present
  if (!window.JSZip) {
    await new Promise((res, rej) => {
      const s = document.createElement('script');
      s.src = 'https://unpkg.com/jszip@3.10.1/dist/jszip.min.js';
      s.onload = res; s.onerror = rej;
      document.head.appendChild(s);
    });
  }
  const zip = await JSZip.loadAsync(buf);
  const ssXml = await zip.file('xl/sharedStrings.xml')?.async('string') || '';
  const sheetXml = await zip.file('xl/worksheets/sheet1.xml')?.async('string') || '';
  if (!sheetXml) throw new Error('Hoja no encontrada en el archivo');

  // Parse shared strings
  const strings = [];
  const sRegex = /<si[^>]*>(?:<t[^>]*>([^<]*)<\/t>|<r>(.*?)<\/r>)<\/si>/g;
  let m;
  // simpler: get all t inside si
  const siBlocks = ssXml.match(/<si[^>]*>.*?<\/si>/g) || [];
  for (const block of siBlocks) {
    const ts = [...block.matchAll(/<t[^>]*>([^<]*)<\/t>/g)].map(mm => mm[1]).join('');
    strings.push(ts.replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>'));
  }

  // Parse rows
  const rows = [];
  const rowR = /<row[^>]*>(.*?)<\/row>/g;
  let rm;
  while ((rm = rowR.exec(sheetXml)) !== null) {
    const inner = rm[1];
    const cells = {};
    const cR = /<c r="([A-Z]+)(\d+)"(?:\s+s="\d+")?(?:\s+t="(\w+)")?[^>]*>(?:<v>([^<]*)<\/v>|<is><t[^>]*>([^<]*)<\/t><\/is>)?<\/c>/g;
    let cm2;
    while ((cm2 = cR.exec(inner)) !== null) {
      const col = cm2[1];
      const t = cm2[3];
      const v = cm2[4];
      const inline = cm2[5];
      if (inline !== undefined) cells[col] = inline;
      else if (v === undefined) continue;
      else if (t === 's') cells[col] = strings[parseInt(v)];
      else cells[col] = v;
    }
    if (Object.keys(cells).length) rows.push(cells);
  }

  if (rows.length < 2) throw new Error('Archivo sin filas de datos');

  // Find header row (row with text labels matching)
  let headerIdx = 0;
  for (let i = 0; i < Math.min(5, rows.length); i++) {
    const vals = Object.values(rows[i]).map(v => String(v).toLowerCase());
    if (vals.some(v => v.includes('codig') || v.includes('descrip'))) { headerIdx = i; break; }
  }
  const header = rows[headerIdx];
  const colMap = {};
  for (const [col, val] of Object.entries(header)) {
    const norm = String(val).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (norm.includes('codig')) colMap.codigo = col;
    else if (norm.includes('categ')) colMap.categoria = col;
    else if (norm.includes('descrip')) colMap.descripcion = col;
    else if (norm.includes('dimens') || norm.includes('medid')) colMap.dimensiones = col;
    else if (norm.includes('precio')) colMap.precio = col;
    else if (norm.includes('stock') || norm.includes('inventar') || norm.includes('exist')) colMap.stock = col;
    else if (norm.includes('unidad')) colMap.unidad = col;
  }
  if (!colMap.codigo || !colMap.descripcion) {
    throw new Error('No se detectaron columnas Código y Descripción');
  }

  const products = [];
  for (let i = headerIdx + 1; i < rows.length; i++) {
    const r = rows[i];
    const codigo = r[colMap.codigo];
    if (!codigo) continue;
    const stockOptions = [0, 0, 2, 5, 8, 12, 15, 20, 25, 35, 50, 4, 6, 18];
    const seed = parseInt(String(codigo).replace(/\D/g, '')) || i;
    products.push({
      codigo: String(codigo).replace(/\.0$/, ''),
      categoria: r[colMap.categoria] || '',
      descripcion: r[colMap.descripcion] || '',
      dimensiones: r[colMap.dimensiones] || '',
      precio: parseFloat(r[colMap.precio]) || 0,
      stock: colMap.stock ? (parseInt(r[colMap.stock]) || 0) : stockOptions[seed % stockOptions.length],
      unidad: colMap.unidad ? (r[colMap.unidad] || 'pieza') : (String(r[colMap.categoria] || '').toLowerCase().startsWith('perfil') ? 'pieza' : 'hoja'),
    });
  }
  return products;
};

window.AdminPanel = AdminPanel;
window.parseExcel = parseExcel;
