"use client";

import { useState } from "react";
import { ArrowLeft, CheckCircle, Download, MessageCircle } from "lucide-react";
import { DatosCliente, Cotizacion } from "@/lib/types";
import { useCart } from "@/lib/cart-context";
import { useEmpresa } from "@/lib/empresa-context";
import { formatDate, generateFolio } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

type Step = "datos" | "revisar" | "exito";

type Props = { onBack: () => void };

export default function CheckoutView({ onBack }: Props) {
  const [step, setStep] = useState<Step>("datos");
  const [folio, setFolio] = useState("");
  const [datos, setDatos] = useState<DatosCliente>({ nombre: "", telefono: "", email: "", direccion: "", notas: "" });
  const [errors, setErrors] = useState<Partial<DatosCliente>>({});
  const [saving, setSaving] = useState(false);
  const { items, clear } = useCart();
  const { empresa } = useEmpresa();

  function validate(): boolean {
    const errs: Partial<DatosCliente> = {};
    if (!datos.nombre.trim()) errs.nombre = "Nombre requerido";
    if (!datos.telefono.trim()) errs.telefono = "Teléfono requerido";
    else if (!/[\d\s+()\-]{8,}$/.test(datos.telefono)) errs.telefono = "Formato inválido";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleConfirm() {
    if (!validate()) return;
    setSaving(true);
    const newFolio = generateFolio();
    setFolio(newFolio);

    const cotizacion: Cotizacion = {
      folio: newFolio,
      fecha: new Date().toISOString(),
      estado: "pendiente",
      datos,
      cart: items,
    };

    try {
      const { data: q, error } = await supabase.from("quotes").insert({
        folio: cotizacion.folio,
        fecha: cotizacion.fecha,
        estado: cotizacion.estado,
        datos: cotizacion.datos,
      }).select().single();

      if (error) throw error;

      await supabase.from("quote_items").insert(
        items.map((item) => ({
          quote_id: q.id,
          codigo: item.codigo,
          descripcion: item.descripcion,
          grupo: item.grupo,
          subclasificacion: item.subclasificacion,
          color: item.color,
          cantidad: item.cantidad,
        }))
      );

      const phone = empresa.whatsapp.replace(/\D/g, "");
      const msg = encodeURIComponent(
        `Hola ${empresa.nombre}, soy ${datos.nombre}. Te envío mi solicitud de cotización ${newFolio} (${items.length} producto${items.length !== 1 ? "s" : ""}). Adjunto el PDF generado por su sistema. Gracias.`
      );
      window.open(`https://wa.me/${phone}?text=${msg}`, "_blank");

      setStep("exito");
      clear();
    } catch (err) {
      console.error(err);
      toast.error("Error al guardar. Intenta de nuevo.");
    } finally {
      setSaving(false);
    }
  }

  function handleDownloadPDF() {
    const fecha = formatDate(new Date().toISOString());
    const rows = items.map((item) => `
      <tr>
        <td class="mono" style="font-size:11px;color:#5A6878;">${item.codigo}</td>
        <td>${item.descripcion}</td>
        <td>${item.grupo}</td>
        <td>${item.subclasificacion}</td>
        <td>${item.color}</td>
        <td>${item.corte ? item.corte : "—"}</td>
        <td style="text-align:center;">${item.cantidad}</td>
      </tr>`).join("");

    const html = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@500&display=swap" rel="stylesheet">
    <style>
      body{font-family:Inter,sans-serif;font-size:12px;color:#1A2332;margin:0;padding:20px;}
      .mono{font-family:'JetBrains Mono',monospace;}
      table{width:100%;border-collapse:collapse;}
      th{background:#0F3D6E;color:white;padding:8px 10px;text-align:left;font-size:10px;text-transform:uppercase;}
      th.num,td.num{text-align:center;}
      td{padding:8px 10px;border-bottom:1px solid #E1E6EC;}
      tbody tr:nth-child(even){background:#F7F9FB;}
      @media print{body{padding:0;}}
    </style></head><body>
    <div style="display:flex;justify-content:space-between;align-items:flex-start;padding-bottom:16px;border-bottom:2px solid #0F3D6E;margin-bottom:16px;">
      <div>
        <div style="font-size:18px;font-weight:700;color:#0F3D6E;">${empresa.nombre}</div>
        <div style="font-size:10px;color:#5A6878;text-transform:uppercase;letter-spacing:0.06em;">${empresa.giro}</div>
        <div style="font-size:11px;color:#5A6878;margin-top:4px;">${empresa.direccion} · ${empresa.telefono}</div>
      </div>
      <div style="text-align:right;">
        <div style="display:inline-block;background:#0F3D6E;color:white;padding:4px 10px;font-size:10px;letter-spacing:0.1em;font-weight:700;">PRE-COTIZACIÓN</div>
        <div style="font-size:18px;font-weight:700;color:#0F3D6E;margin-top:6px;" class="mono">${folio || generateFolio()}</div>
        <div style="font-size:11px;color:#5A6878;margin-top:2px;">${fecha}</div>
      </div>
    </div>
    <div style="background:#FFF8E1;border-left:3px solid #F59E0B;padding:10px 14px;margin-bottom:16px;font-size:11px;color:#5C4310;">
      Este documento es una <strong>pre-cotización</strong>. Los precios y disponibilidad serán validados por el equipo de ventas antes de confirmar el pedido.
    </div>
    <div style="padding:14px;background:#F7F9FB;border:1px solid #E1E6EC;border-radius:4px;margin-bottom:16px;">
      <h4 style="margin:0 0 8px;font-size:11px;color:#0F3D6E;text-transform:uppercase;letter-spacing:0.06em;">Datos del cliente</h4>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px 24px;">
        <div><label style="display:block;font-size:10px;color:#93A0AE;text-transform:uppercase;">Nombre</label><span style="font-size:12px;font-weight:500;">${datos.nombre}</span></div>
        <div><label style="display:block;font-size:10px;color:#93A0AE;text-transform:uppercase;">Teléfono</label><span style="font-size:12px;font-weight:500;">${datos.telefono}</span></div>
        ${datos.email ? `<div><label style="display:block;font-size:10px;color:#93A0AE;text-transform:uppercase;">Email</label><span style="font-size:12px;font-weight:500;">${datos.email}</span></div>` : ""}
        ${datos.direccion ? `<div><label style="display:block;font-size:10px;color:#93A0AE;text-transform:uppercase;">Dirección de obra</label><span style="font-size:12px;font-weight:500;">${datos.direccion}</span></div>` : ""}
      </div>
    </div>
    <table>
      <thead><tr>
        <th>Código</th><th>Descripción</th><th>Grupo</th><th>Sub clasificación</th><th>Color</th><th>Corte</th>
        <th class="num">Cant.</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>
    ${datos.notas ? `<div style="margin-top:16px;padding:12px 14px;background:#F7F9FB;border:1px solid #E1E6EC;border-radius:4px;">
      <h4 style="margin:0 0 6px;font-size:11px;color:#0F3D6E;text-transform:uppercase;">Notas del cliente</h4>
      <p style="margin:0;font-size:12px;">${datos.notas}</p>
    </div>` : ""}
    <div style="margin-top:24px;padding-top:12px;border-top:1px solid #E1E6EC;font-size:10px;color:#93A0AE;">
      <p style="margin:2px 0;">Este documento no tiene validez como factura o comprobante de pago.</p>
      <p style="margin:2px 0;">Los precios están sujetos a confirmación. Vigencia: 7 días hábiles.</p>
    </div>
    <script>window.onload=()=>{window.print();}</script>
    </body></html>`;

    const win = window.open("", "_blank");
    if (win) { win.document.write(html); win.document.close(); }
  }

  if (step === "exito") {
    return <SuccessView folio={folio} itemCount={items.length + (clear(), 0) || 0} onBack={onBack} />;
  }

  return (
    <main style={{ flex: 1 }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: 24 }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, gap: 24, flexWrap: "wrap" }}>
          <button onClick={onBack} style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--primary)", fontWeight: 600, padding: "8px 14px", borderRadius: 6, fontSize: 13 }}>
            <ArrowLeft size={16} /> Volver al catálogo
          </button>
          <Stepper step={step} />
        </div>

        {step === "datos" && (
          <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 24 }} className="checkout-grid">
            <div style={{ background: "white", padding: 28, borderRadius: "var(--radius-lg)", border: "1px solid var(--border)" }}>
              <h2 style={{ margin: "0 0 4px", fontSize: 20 }}>Datos de contacto</h2>
              <p style={{ color: "var(--ink-mute)", fontSize: 13, margin: "0 0 20px" }}>Los campos con * son obligatorios</p>

              <Field label="Nombre completo *" error={errors.nombre}>
                <input value={datos.nombre} onChange={(e) => setDatos({ ...datos, nombre: e.target.value })}
                  placeholder="Ej: Juan García" className={errors.nombre ? "field-error" : ""} />
              </Field>
              <Field label="Teléfono / WhatsApp *" error={errors.telefono}>
                <input value={datos.telefono} onChange={(e) => setDatos({ ...datos, telefono: e.target.value })}
                  placeholder="Ej: +52 55 1234 5678" className={errors.telefono ? "field-error" : ""} />
              </Field>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }} className="field-row-responsive">
                <Field label="Email (opcional)">
                  <input value={datos.email} onChange={(e) => setDatos({ ...datos, email: e.target.value })}
                    placeholder="correo@ejemplo.com" type="email" />
                </Field>
                <Field label="Dirección de obra (opcional)">
                  <input value={datos.direccion} onChange={(e) => setDatos({ ...datos, direccion: e.target.value })}
                    placeholder="Calle, número, colonia" />
                </Field>
              </div>
              <Field label="Notas adicionales (opcional)">
                <textarea value={datos.notas} onChange={(e) => setDatos({ ...datos, notas: e.target.value })}
                  rows={3} placeholder="Especificaciones, medidas adicionales, preguntas..." style={{ resize: "vertical" }} />
              </Field>

              <button
                onClick={() => { if (validate()) setStep("revisar"); }}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  background: "var(--primary)", color: "white", padding: "14px 22px",
                  borderRadius: "var(--radius)", fontWeight: 600, fontSize: 15, width: "100%",
                }}
              >
                Revisar pre-cotización →
              </button>
            </div>
            <OrderSummary />
          </div>
        )}

        {step === "revisar" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div>
              <h2 style={{ margin: 0, fontSize: 22 }}>Revisa tu pre-cotización</h2>
              <p style={{ margin: "4px 0 0", color: "var(--ink-mute)", fontSize: 13 }}>Verifica los datos antes de enviar</p>
            </div>

            <PDFPreview datos={datos} folio="PRE-PREVIEW" empresa={empresa} items={items} />

            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <button onClick={() => setStep("datos")} style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                background: "white", color: "var(--ink)", border: "1px solid var(--border)",
                padding: "12px 20px", borderRadius: "var(--radius)", fontWeight: 500, fontSize: 14,
              }}>
                <ArrowLeft size={16} /> Editar datos
              </button>
              <button onClick={handleDownloadPDF} style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                background: "var(--ink)", color: "white", padding: "12px 20px",
                borderRadius: "var(--radius)", fontWeight: 600, fontSize: 14,
              }}>
                <Download size={16} /> Descargar PDF
              </button>
              <button onClick={handleConfirm} disabled={saving} style={{
                display: "inline-flex", alignItems: "center", gap: 8, flex: 1, justifyContent: "center",
                background: "var(--whatsapp)", color: "white", padding: "12px 20px",
                borderRadius: "var(--radius)", fontWeight: 700, fontSize: 14,
                boxShadow: "0 4px 12px rgba(37,211,102,0.35)", minWidth: 220,
                opacity: saving ? 0.7 : 1,
              }}>
                <MessageCircle size={18} />
                {saving ? "Guardando..." : "Enviar por WhatsApp"}
              </button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        input, textarea { width: 100%; padding: 10px 12px; border: 1px solid var(--border); border-radius: 6px; outline: none; transition: all 0.15s; background: white; }
        input:focus, textarea:focus { border-color: var(--primary); box-shadow: 0 0 0 3px var(--primary-light); }
        .field-error { border-color: var(--danger) !important; }
        @media (max-width: 900px) {
          .checkout-grid { grid-template-columns: 1fr !important; }
          .field-row-responsive { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </main>
  );
}

function Stepper({ step }: { step: Step }) {
  const steps = [
    { id: "datos", label: "Datos" },
    { id: "revisar", label: "Revisar" },
    { id: "exito", label: "Enviar" },
  ] as const;
  const idx = steps.findIndex((s) => s.id === step);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      {steps.map((s, i) => (
        <span key={s.id} style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {i > 0 && <span style={{ width: 32, height: 1, background: "var(--border)" }} />}
          <span style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: i <= idx ? "var(--primary)" : "var(--ink-soft)", fontWeight: 500 }}>
            <span style={{
              width: 26, height: 26, borderRadius: "50%",
              background: i <= idx ? "var(--primary)" : "var(--bg)",
              border: `1px solid ${i <= idx ? "var(--primary)" : "var(--border)"}`,
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              fontWeight: 600, fontSize: 12, color: i <= idx ? "white" : "var(--ink-soft)",
            }}>
              {i + 1}
            </span>
            {s.label}
          </span>
        </span>
      ))}
    </div>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: "block", fontSize: 12, color: "var(--ink-mute)", marginBottom: 6, fontWeight: 500 }}>
        {label}
      </label>
      {children}
      {error && <span style={{ fontSize: 11, color: "var(--danger)", marginTop: 4, display: "block" }}>{error}</span>}
    </div>
  );
}

function OrderSummary() {
  const { items } = useCart();
  return (
    <div style={{
      background: "white", padding: 24, borderRadius: "var(--radius-lg)",
      border: "1px solid var(--border)", alignSelf: "flex-start", position: "sticky", top: 80,
    }}>
      <h3 style={{ margin: "0 0 16px", fontSize: 15 }}>Resumen ({items.length} productos)</h3>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: 320, overflowY: "auto" }}>
        {items.map((item) => (
          <div key={item.codigo} style={{ display: "flex", justifyContent: "space-between", gap: 12, fontSize: 13, paddingBottom: 10, borderBottom: "1px dashed var(--border)" }}>
            <span>{item.descripcion} <span style={{ color: "var(--ink-soft)" }}>({item.color}{item.corte ? `, ${item.corte}` : ""})</span> × {item.cantidad}</span>
          </div>
        ))}
      </div>
      <p style={{ fontSize: 10, color: "var(--ink-soft)", marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--border)" }}>
        Sujeto a confirmación de stock y precios
      </p>
    </div>
  );
}

import { Empresa, CartItem } from "@/lib/types";

function PDFPreview({ datos, folio, empresa, items }: { datos: DatosCliente; folio: string; empresa: Empresa; items: CartItem[] }) {
  return (
    <div style={{
      background: "white", padding: "36px 40px", borderRadius: "var(--radius-lg)",
      border: "1px solid var(--border)", boxShadow: "var(--shadow)", fontSize: 12,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", paddingBottom: 16, borderBottom: "2px solid var(--primary)" }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: "var(--primary)" }}>{empresa.nombre}</div>
          <div style={{ fontSize: 10, color: "var(--ink-mute)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{empresa.giro}</div>
          <div style={{ fontSize: 11, color: "var(--ink-mute)", marginTop: 4 }}>{empresa.direccion} · {empresa.telefono}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ display: "inline-block", background: "var(--primary)", color: "white", padding: "4px 10px", fontSize: 10, letterSpacing: "0.1em", fontWeight: 700 }}>
            PRE-COTIZACIÓN
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, color: "var(--primary)", marginTop: 6, fontFamily: "monospace" }}>{folio}</div>
          <div style={{ fontSize: 11, color: "var(--ink-mute)", marginTop: 2 }}>{formatDate(new Date().toISOString())}</div>
        </div>
      </div>

      <div style={{ background: "#FFF8E1", borderLeft: "3px solid var(--warning)", padding: "10px 14px", margin: "16px 0", fontSize: 11, color: "#5C4310" }}>
        Este documento es una <strong>pre-cotización</strong>. Será validada por personal de ventas.
      </div>

      <div style={{ padding: 14, background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 4, marginBottom: 16 }}>
        <h4 style={{ margin: "0 0 8px", fontSize: 11, color: "var(--primary)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Datos del cliente</h4>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 24px" }}>
          {([["Nombre", datos.nombre], ["Teléfono", datos.telefono], ...(datos.email ? [["Email", datos.email]] : []), ...(datos.direccion ? [["Dirección", datos.direccion]] : [])] as [string, string][]).map(([lbl, val]) => (
            <div key={lbl}>
              <label style={{ display: "block", fontSize: 10, color: "var(--ink-soft)", textTransform: "uppercase" }}>{lbl}</label>
              <span style={{ fontSize: 12, fontWeight: 500 }}>{val}</span>
            </div>
          ))}
        </div>
      </div>

      <table style={{ width: "100%", borderCollapse: "collapse", margin: "16px 0" }}>
        <thead>
          <tr style={{ background: "var(--primary)", color: "white" }}>
            {["Código", "Descripción", "Grupo", "Sub clasificación", "Color", "Corte", "Cant."].map((h, i) => (
              <th key={h} style={{ textAlign: i >= 6 ? "right" : "left", padding: "8px 10px", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.04em" }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.map((item, idx) => (
            <tr key={item.codigo} style={{ background: idx % 2 === 1 ? "var(--bg)" : "white" }}>
              <td style={{ padding: "8px 10px", fontFamily: "monospace", fontSize: 11, color: "var(--ink-mute)", borderBottom: "1px solid var(--border)" }}>{item.codigo}</td>
              <td style={{ padding: "8px 10px", borderBottom: "1px solid var(--border)" }}>{item.descripcion}</td>
              <td style={{ padding: "8px 10px", borderBottom: "1px solid var(--border)" }}>{item.grupo}</td>
              <td style={{ padding: "8px 10px", borderBottom: "1px solid var(--border)" }}>{item.subclasificacion}</td>
              <td style={{ padding: "8px 10px", borderBottom: "1px solid var(--border)" }}>{item.color}</td>
              <td style={{ padding: "8px 10px", borderBottom: "1px solid var(--border)", textTransform: "capitalize" }}>{item.corte || "—"}</td>
              <td style={{ padding: "8px 10px", textAlign: "right", borderBottom: "1px solid var(--border)" }}>{item.cantidad}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {datos.notas && (
        <div style={{ padding: "12px 14px", background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 4 }}>
          <h4 style={{ margin: "0 0 6px", fontSize: 11, color: "var(--primary)", textTransform: "uppercase" }}>Notas</h4>
          <p style={{ margin: 0, fontSize: 12 }}>{datos.notas}</p>
        </div>
      )}
    </div>
  );
}

function SuccessView({ folio, itemCount, onBack }: { folio: string; itemCount: number; onBack: () => void }) {
  return (
    <main style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ maxWidth: 500, width: "100%", textAlign: "center", background: "white", borderRadius: "var(--radius-lg)", padding: "48px 32px", border: "1px solid var(--border)" }}>
        <CheckCircle size={56} color="var(--success)" style={{ marginBottom: 16 }} />
        <h2 style={{ margin: "0 0 8px", fontSize: 24, color: "var(--ink)" }}>¡Pre-cotización enviada!</h2>
        <p style={{ margin: "4px 0", color: "var(--ink-mute)" }}>Tu solicitud fue registrada correctamente.</p>
        <p style={{ color: "var(--ink-mute)", margin: "16px 0 24px" }}>
          El equipo de ventas revisará disponibilidad y precios y te contactará pronto.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, background: "var(--bg)", padding: 16, borderRadius: "var(--radius)", marginBottom: 24 }}>
          <div><label style={{ display: "block", fontSize: 10, color: "var(--ink-soft)", textTransform: "uppercase" }}>Folio</label><span style={{ fontWeight: 600, fontSize: 13, fontFamily: "monospace" }}>{folio}</span></div>
          <div><label style={{ display: "block", fontSize: 10, color: "var(--ink-soft)", textTransform: "uppercase" }}>Productos</label><span style={{ fontWeight: 600, fontSize: 13 }}>{itemCount}</span></div>
        </div>
        <button onClick={onBack} style={{
          display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
          background: "var(--primary)", color: "white", padding: "12px 24px",
          borderRadius: "var(--radius)", fontWeight: 600, fontSize: 15, width: "100%",
        }}>
          Volver al catálogo
        </button>
      </div>
    </main>
  );
}
