// Flujo de checkout: datos cliente → preview PDF → WhatsApp

const CheckoutFlow = ({ cart, onBack, onComplete, empresa }) => {
  const [step, setStep] = React.useState(1); // 1: datos, 2: preview, 3: enviado
  const [datos, setDatos] = React.useState({
    nombre: '', telefono: '', email: '', direccion: '', notas: ''
  });
  const [errors, setErrors] = React.useState({});
  const [folio] = React.useState(() => 'PRE-' + Date.now().toString().slice(-7));

  const validate = () => {
    const e = {};
    if (!datos.nombre.trim()) e.nombre = 'Requerido';
    if (!datos.telefono.trim()) e.telefono = 'Requerido';
    else if (!/^[\d\s+()-]{8,}$/.test(datos.telefono)) e.telefono = 'Teléfono inválido';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const subtotal = cart.reduce((s, i) => s + i.precio * i.cantidad, 0);

  return (
    <div className="checkout">
      <div className="checkout-head">
        <button className="back-btn" onClick={onBack}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
          Volver al catálogo
        </button>
        <div className="stepper">
          <div className={"step " + (step >= 1 ? 'active' : '')}><span>1</span> Datos</div>
          <div className="step-bar"></div>
          <div className={"step " + (step >= 2 ? 'active' : '')}><span>2</span> Revisar</div>
          <div className="step-bar"></div>
          <div className={"step " + (step >= 3 ? 'active' : '')}><span>3</span> Enviar</div>
        </div>
      </div>

      {step === 1 && (
        <div className="checkout-body">
          <div className="checkout-form">
            <h2>Tus datos de contacto</h2>
            <p className="subtitle">Para que podamos enviarte la cotización oficial validada.</p>
            <div className="field">
              <label>Nombre completo *</label>
              <input
                value={datos.nombre}
                onChange={e => setDatos({...datos, nombre: e.target.value})}
                className={errors.nombre ? 'error' : ''}
                placeholder="Juan Pérez"
              />
              {errors.nombre && <span className="err-msg">{errors.nombre}</span>}
            </div>
            <div className="field-row">
              <div className="field">
                <label>WhatsApp / Teléfono *</label>
                <input
                  value={datos.telefono}
                  onChange={e => setDatos({...datos, telefono: e.target.value})}
                  className={errors.telefono ? 'error' : ''}
                  placeholder="+52 55 1234 5678"
                />
                {errors.telefono && <span className="err-msg">{errors.telefono}</span>}
              </div>
              <div className="field">
                <label>Correo electrónico</label>
                <input
                  type="email"
                  value={datos.email}
                  onChange={e => setDatos({...datos, email: e.target.value})}
                  placeholder="correo@ejemplo.com"
                />
              </div>
            </div>
            <div className="field">
              <label>Dirección de obra / entrega</label>
              <input
                value={datos.direccion}
                onChange={e => setDatos({...datos, direccion: e.target.value})}
                placeholder="Calle, número, colonia, ciudad"
              />
            </div>
            <div className="field">
              <label>Notas u observaciones</label>
              <textarea
                rows="3"
                value={datos.notas}
                onChange={e => setDatos({...datos, notas: e.target.value})}
                placeholder="Especificaciones, fechas, dudas..."
              />
            </div>
            <button className="btn-primary big" onClick={() => { if (validate()) setStep(2); }}>
              Revisar pre‑cotización
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            </button>
          </div>
          <div className="checkout-summary">
            <h3>Resumen ({cart.length} productos)</h3>
            <div className="sum-list">
              {cart.map(i => (
                <div key={i.codigo} className="sum-item">
                  <span>{i.cantidad}× {i.descripcion}</span>
                  <span>{formatMoney(i.precio * i.cantidad)}</span>
                </div>
              ))}
            </div>
            <div className="sum-total">
              <span>Subtotal estimado</span>
              <strong>{formatMoney(subtotal)}</strong>
            </div>
            <p className="micro">Sujeto a validación de stock y precios.</p>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="checkout-preview">
          <div className="preview-actions">
            <h2>Revisa tu pre‑cotización</h2>
            <p>Si todo está correcto, descarga el PDF y envíalo por WhatsApp.</p>
          </div>
          <PDFPreview
            cart={cart}
            datos={datos}
            empresa={empresa}
            folio={folio}
          />
          <div className="action-buttons">
            <button className="btn-secondary" onClick={() => setStep(1)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
              Editar datos
            </button>
            <button className="btn-pdf" onClick={() => generatePDF(cart, datos, empresa, folio)}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Descargar PDF
            </button>
            <button className="btn-whatsapp" onClick={() => {
              generatePDF(cart, datos, empresa, folio);
              const msg = encodeURIComponent(
                `Hola ${empresa.nombre}, soy ${datos.nombre}. Te envío mi pre‑cotización ${folio} por ${formatMoney(subtotal)} (${cart.length} productos). Adjunto el PDF generado por su sistema. Gracias.`
              );
              const phone = (empresa.whatsapp || '').replace(/\D/g, '');
              window.open(`https://wa.me/${phone}?text=${msg}`, '_blank');
              // Save to admin store
              saveQuote({ folio, datos, cart, total: subtotal, fecha: new Date().toISOString(), estado: 'pendiente' });
              setTimeout(() => setStep(3), 600);
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0 0 20.465 3.488"/></svg>
              Enviar por WhatsApp
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="checkout-success">
          <div className="success-icon">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          </div>
          <h2>¡Pre‑cotización enviada!</h2>
          <p>Folio: <strong>{folio}</strong></p>
          <p className="success-text">
            Recibimos tu solicitud. En breve, personal de ventas validará disponibilidad y te contactará por WhatsApp con la cotización oficial.
          </p>
          <div className="success-summary">
            <div><label>Productos</label><span>{cart.length}</span></div>
            <div><label>Total estimado</label><span>{formatMoney(subtotal)}</span></div>
            <div><label>Contacto</label><span>{datos.telefono}</span></div>
          </div>
          <button className="btn-primary" onClick={onComplete}>Volver al inicio</button>
        </div>
      )}
    </div>
  );
};

// PDF Preview component (visual on screen)
const PDFPreview = ({ cart, datos, empresa, folio }) => {
  const subtotal = cart.reduce((s, i) => s + i.precio * i.cantidad, 0);
  const fecha = new Date().toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' });
  return (
    <div className="pdf-preview" id="pdf-preview-content">
      <div className="pdf-head">
        <div className="pdf-brand">
          <div className="pdf-logo">
            <svg width="42" height="42" viewBox="0 0 60 60" fill="none">
              <rect x="6" y="6" width="48" height="48" rx="3" stroke="#0F3D6E" strokeWidth="3" fill="#E8F0F7"/>
              <line x1="6" y1="30" x2="54" y2="30" stroke="#0F3D6E" strokeWidth="2"/>
              <line x1="30" y1="6" x2="30" y2="54" stroke="#0F3D6E" strokeWidth="2"/>
              <polygon points="6,6 30,30 6,30" fill="#0F3D6E" opacity="0.15"/>
            </svg>
          </div>
          <div>
            <div className="pdf-empresa">{empresa.nombre}</div>
            <div className="pdf-empresa-sub">{empresa.giro}</div>
            <div className="pdf-empresa-info">{empresa.direccion} · {empresa.telefono}</div>
          </div>
        </div>
        <div className="pdf-folio">
          <div className="pdf-tag">PRE‑COTIZACIÓN</div>
          <div className="pdf-folio-num">{folio}</div>
          <div className="pdf-fecha">{fecha}</div>
        </div>
      </div>

      <div className="pdf-warning">
        ⚠ Este documento es una <strong>pre‑cotización</strong> generada por el cliente. Será validada por personal de ventas confirmando stock y precios finales antes de emitir cotización oficial.
      </div>

      <div className="pdf-cliente">
        <h4>Cliente</h4>
        <div className="pdf-cliente-grid">
          <div><label>Nombre</label><span>{datos.nombre}</span></div>
          <div><label>Teléfono</label><span>{datos.telefono}</span></div>
          {datos.email && <div><label>Correo</label><span>{datos.email}</span></div>}
          {datos.direccion && <div><label>Dirección</label><span>{datos.direccion}</span></div>}
        </div>
      </div>

      <table className="pdf-table">
        <thead>
          <tr>
            <th>Código</th>
            <th>Descripción</th>
            <th>Categoría</th>
            <th>Dimensiones</th>
            <th className="num">Cant.</th>
            <th className="num">P. Unit.</th>
            <th className="num">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          {cart.map(i => (
            <tr key={i.codigo}>
              <td className="mono">{i.codigo}</td>
              <td>{i.descripcion}</td>
              <td>{i.categoria}</td>
              <td>{i.dimensiones}</td>
              <td className="num">{i.cantidad}</td>
              <td className="num">{formatMoney(i.precio)}</td>
              <td className="num">{formatMoney(i.precio * i.cantidad)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan="6" className="num">Total estimado</td>
            <td className="num"><strong>{formatMoney(subtotal)}</strong></td>
          </tr>
        </tfoot>
      </table>

      {datos.notas && (
        <div className="pdf-notas">
          <h4>Notas del cliente</h4>
          <p>{datos.notas}</p>
        </div>
      )}

      <div className="pdf-foot">
        <p>* Precios sujetos a confirmación. Pre‑cotización válida solo como referencia inicial.</p>
        <p>* Para cotización oficial contacte a {empresa.telefono} o WhatsApp {empresa.whatsapp}.</p>
      </div>
    </div>
  );
};

// Generate PDF using window.print on a hidden iframe with just the preview
const generatePDF = (cart, datos, empresa, folio) => {
  const subtotal = cart.reduce((s, i) => s + i.precio * i.cantidad, 0);
  const fecha = new Date().toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' });

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${folio} – ${empresa.nombre}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: -apple-system, 'Segoe UI', Roboto, sans-serif; color: #1a1a1a; margin: 0; padding: 32px; font-size: 11px; }
  .head { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 16px; border-bottom: 2px solid #0F3D6E; }
  .brand { display: flex; gap: 14px; align-items: center; }
  .logo { width: 56px; height: 56px; border: 2px solid #0F3D6E; background: #E8F0F7; display: flex; align-items: center; justify-content: center; }
  .logo svg { width: 40px; height: 40px; }
  .nombre { font-size: 16px; font-weight: 700; color: #0F3D6E; letter-spacing: -.01em; }
  .giro { font-size: 10px; color: #555; text-transform: uppercase; letter-spacing: .08em; margin-top: 2px; }
  .info { font-size: 10px; color: #666; margin-top: 4px; }
  .folio { text-align: right; }
  .tag { display: inline-block; background: #0F3D6E; color: white; padding: 4px 10px; font-size: 9px; letter-spacing: .12em; font-weight: 700; }
  .num { font-size: 18px; font-weight: 700; color: #0F3D6E; margin-top: 6px; font-family: 'SF Mono', Menlo, monospace; }
  .fecha { font-size: 10px; color: #666; margin-top: 2px; }
  .warning { background: #FFF8E1; border-left: 3px solid #F59E0B; padding: 10px 14px; margin: 18px 0; font-size: 10.5px; color: #5C4310; }
  .cliente { margin: 16px 0; padding: 14px; background: #F7F9FB; border: 1px solid #E1E6EC; }
  .cliente h4 { margin: 0 0 8px; font-size: 11px; color: #0F3D6E; text-transform: uppercase; letter-spacing: .08em; }
  .cli-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px 24px; }
  .cli-grid label { display: block; font-size: 9px; color: #888; text-transform: uppercase; letter-spacing: .04em; }
  .cli-grid span { font-size: 11px; color: #1a1a1a; font-weight: 500; }
  table { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 10.5px; }
  th { background: #0F3D6E; color: white; text-align: left; padding: 8px 10px; font-size: 9.5px; text-transform: uppercase; letter-spacing: .04em; }
  th.num, td.num { text-align: right; }
  td { padding: 7px 10px; border-bottom: 1px solid #E1E6EC; }
  tbody tr:nth-child(even) { background: #FAFBFC; }
  .mono { font-family: 'SF Mono', Menlo, monospace; font-size: 10px; color: #555; }
  tfoot td { background: #F7F9FB; font-weight: 700; padding: 12px 10px; font-size: 12px; color: #0F3D6E; border-top: 2px solid #0F3D6E; border-bottom: none; }
  .notas { margin-top: 12px; padding: 12px 14px; background: #FAFBFC; border: 1px solid #E1E6EC; }
  .notas h4 { margin: 0 0 6px; font-size: 11px; color: #0F3D6E; text-transform: uppercase; }
  .notas p { margin: 0; font-size: 11px; line-height: 1.5; color: #333; }
  .foot { margin-top: 24px; padding-top: 12px; border-top: 1px solid #E1E6EC; font-size: 9px; color: #888; }
  .foot p { margin: 2px 0; }
  @media print { body { padding: 16px; } @page { margin: 12mm; } }
</style></head><body>
<div class="head">
  <div class="brand">
    <div class="logo">
      <svg viewBox="0 0 60 60" fill="none">
        <rect x="6" y="6" width="48" height="48" rx="3" stroke="#0F3D6E" stroke-width="3" fill="#E8F0F7"/>
        <line x1="6" y1="30" x2="54" y2="30" stroke="#0F3D6E" stroke-width="2"/>
        <line x1="30" y1="6" x2="30" y2="54" stroke="#0F3D6E" stroke-width="2"/>
        <polygon points="6,6 30,30 6,30" fill="#0F3D6E" opacity="0.15"/>
      </svg>
    </div>
    <div>
      <div class="nombre">${empresa.nombre}</div>
      <div class="giro">${empresa.giro}</div>
      <div class="info">${empresa.direccion} · Tel: ${empresa.telefono}</div>
      <div class="info">WhatsApp: ${empresa.whatsapp}</div>
    </div>
  </div>
  <div class="folio">
    <div class="tag">PRE‑COTIZACIÓN</div>
    <div class="num">${folio}</div>
    <div class="fecha">${fecha}</div>
  </div>
</div>
<div class="warning">
  ⚠ Este documento es una <strong>pre‑cotización</strong> generada por el cliente desde el cotizador en línea. Será validada por personal de ventas confirmando stock y precios finales antes de emitir la cotización oficial.
</div>
<div class="cliente">
  <h4>Datos del cliente</h4>
  <div class="cli-grid">
    <div><label>Nombre</label><span>${datos.nombre}</span></div>
    <div><label>Teléfono / WhatsApp</label><span>${datos.telefono}</span></div>
    ${datos.email ? `<div><label>Correo</label><span>${datos.email}</span></div>` : ''}
    ${datos.direccion ? `<div><label>Dirección</label><span>${datos.direccion}</span></div>` : ''}
  </div>
</div>
<table>
  <thead><tr>
    <th>Código</th><th>Descripción</th><th>Categoría</th><th>Dim.</th>
    <th class="num">Cant.</th><th class="num">P. Unit.</th><th class="num">Subtotal</th>
  </tr></thead>
  <tbody>
    ${cart.map(i => `<tr>
      <td class="mono">${i.codigo}</td>
      <td>${i.descripcion}</td>
      <td>${i.categoria}</td>
      <td>${i.dimensiones}</td>
      <td class="num">${i.cantidad}</td>
      <td class="num">${formatMoney(i.precio)}</td>
      <td class="num">${formatMoney(i.precio * i.cantidad)}</td>
    </tr>`).join('')}
  </tbody>
  <tfoot><tr>
    <td colspan="6" class="num">Total estimado</td>
    <td class="num">${formatMoney(subtotal)}</td>
  </tr></tfoot>
</table>
${datos.notas ? `<div class="notas"><h4>Notas del cliente</h4><p>${datos.notas.replace(/\n/g, '<br>')}</p></div>` : ''}
<div class="foot">
  <p>* Precios sujetos a confirmación. Pre‑cotización válida únicamente como referencia inicial.</p>
  <p>* Para cotización oficial contacte a ${empresa.telefono} o WhatsApp ${empresa.whatsapp}.</p>
  <p>* Documento generado el ${fecha} desde el cotizador en línea de ${empresa.nombre}.</p>
</div>
</body></html>`;

  // Open in new window for printing/saving as PDF
  const w = window.open('', '_blank');
  if (!w) {
    alert('Permite ventanas emergentes para descargar el PDF.');
    return;
  }
  w.document.write(html);
  w.document.close();
  setTimeout(() => { w.focus(); w.print(); }, 400);
};

const saveQuote = (quote) => {
  try {
    const list = JSON.parse(localStorage.getItem('quotes') || '[]');
    list.unshift(quote);
    localStorage.setItem('quotes', JSON.stringify(list));
  } catch(e) { console.error(e); }
};

window.CheckoutFlow = CheckoutFlow;
window.saveQuote = saveQuote;
window.generatePDF = generatePDF;
