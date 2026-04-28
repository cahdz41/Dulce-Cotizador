"use client";

import { useEffect, useState, useRef } from "react";
import { MessageCircle, Mail, Trash2, Check, RotateCcw, Upload, Save } from "lucide-react";
import { Cotizacion, Empresa, Producto } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { useEmpresa } from "@/lib/empresa-context";
import { CATALOG_DATA } from "@/lib/catalog-data";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import PhotoManager from "@/components/admin/photo-manager";

type Tab = "cotizaciones" | "catalogo" | "empresa" | "fotos";

export default function AdminView() {
  const [tab, setTab] = useState<Tab>("cotizaciones");
  const [quotes, setQuotes] = useState<Cotizacion[]>([]);
  const [products, setProducts] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadQuotes();
    loadProducts();
  }, []);

  async function loadQuotes() {
    setLoading(true);
    const { data } = await supabase
      .from("quotes")
      .select("*, quote_items(*)")
      .order("created_at", { ascending: false });

    if (data) {
      setQuotes(data.map((q) => ({
        id: q.id,
        folio: q.folio,
        fecha: q.fecha,
        estado: q.estado,
        datos: q.datos,
        total: q.total,
        cart: q.quote_items.map((i: { codigo: string; categoria: string; descripcion: string; dimensiones: string; precio: number; cantidad: number; unidad?: string }) => ({
          codigo: i.codigo, categoria: i.categoria, descripcion: i.descripcion,
          dimensiones: i.dimensiones, precio: i.precio, cantidad: i.cantidad,
          stock: 0, unidad: i.unidad || "pieza",
        })),
      })));
    }
    setLoading(false);
  }

  async function loadProducts() {
    const { data } = await supabase.from("products").select("*").order("categoria");
    if (data && data.length > 0) setProducts(data);
    else setProducts(CATALOG_DATA);
  }

  const pendientes = quotes.filter((q) => q.estado === "pendiente").length;

  return (
    <main style={{ flex: 1 }}>
      <div style={{ maxWidth: 1400, margin: "0 auto", padding: 24 }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ margin: 0, fontSize: 24 }}>Panel de administración</h1>
          <p style={{ margin: "4px 0 0", color: "var(--ink-mute)" }}>Gestiona cotizaciones, catálogo y datos de la empresa</p>
        </div>

        <StatsRow quotes={quotes} productCount={products.filter((p) => p.stock > 0).length} />

        <div style={{ display: "flex", gap: 4, borderBottom: "1px solid var(--border)", marginBottom: 24 }}>
          <TabBtn active={tab === "cotizaciones"} onClick={() => setTab("cotizaciones")} badge={pendientes > 0 ? pendientes : undefined}>
            Pre-cotizaciones
          </TabBtn>
          <TabBtn active={tab === "catalogo"} onClick={() => setTab("catalogo")}>Catálogo</TabBtn>
          <TabBtn active={tab === "empresa"} onClick={() => setTab("empresa")}>Datos de empresa</TabBtn>
          <TabBtn active={tab === "fotos"} onClick={() => setTab("fotos")}>Fotos de productos</TabBtn>
        </div>

        {tab === "cotizaciones" && <QuotesPanel quotes={quotes} loading={loading} onRefresh={loadQuotes} />}
        {tab === "catalogo" && <CatalogPanel products={products} onRefresh={loadProducts} />}
        {tab === "empresa" && <EmpresaPanel />}
        {tab === "fotos" && (
          <div style={{ background: "white", padding: 24, borderRadius: "var(--radius-lg)", border: "1px solid var(--border)" }}>
            <h3 style={{ margin: "0 0 6px", fontSize: 16 }}>Fotos de productos</h3>
            <p style={{ color: "var(--ink-mute)", fontSize: 13, margin: "0 0 20px" }}>
              Sube imágenes para cada producto. La IA elimina el fondo automáticamente antes de guardar.
            </p>
            <PhotoManager products={products} />
          </div>
        )}
      </div>
    </main>
  );
}

function StatsRow({ quotes, productCount }: { quotes: Cotizacion[]; productCount: number }) {
  const pendientes = quotes.filter((q) => q.estado === "pendiente").length;
  const atendidas = quotes.filter((q) => q.estado === "atendida").length;
  const totalAtendido = quotes.filter((q) => q.estado === "atendida").reduce((s, q) => s + q.total, 0);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginBottom: 24 }}>
      <StatCard label="Total cotizaciones" value={quotes.length} />
      <StatCard label="Pendientes" value={pendientes} highlight />
      <StatCard label="Atendidas" value={atendidas} />
      <StatCard label="Productos activos" value={productCount} />
      <StatCard label="Total cotizado (atendido)" value={formatCurrency(totalAtendido)} mono />
    </div>
  );
}

function StatCard({ label, value, highlight, mono }: { label: string; value: string | number; highlight?: boolean; mono?: boolean }) {
  return (
    <div style={{
      padding: 18, borderRadius: "var(--radius-lg)",
      background: highlight ? "linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)" : "white",
      border: highlight ? "none" : "1px solid var(--border)",
      color: highlight ? "white" : "inherit",
    }}>
      <div style={{ fontSize: 28, fontWeight: 700, color: highlight ? "white" : "var(--primary)", fontFamily: mono ? "monospace" : "inherit", letterSpacing: "-0.02em" }}>
        {value}
      </div>
      <div style={{ fontSize: 11, color: highlight ? "rgba(255,255,255,0.8)" : "var(--ink-mute)", textTransform: "uppercase", letterSpacing: "0.04em", marginTop: 4 }}>
        {label}
      </div>
    </div>
  );
}

function TabBtn({ active, onClick, badge, children }: { active: boolean; onClick: () => void; badge?: number; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "10px 16px", fontSize: 13, fontWeight: active ? 600 : 500,
        color: active ? "var(--primary)" : "var(--ink-mute)",
        borderBottom: `2px solid ${active ? "var(--primary)" : "transparent"}`,
        transition: "all 0.15s", display: "inline-flex", alignItems: "center", gap: 8,
      }}
    >
      {children}
      {badge !== undefined && (
        <span style={{ background: "var(--accent)", color: "white", fontSize: 10, padding: "2px 7px", borderRadius: 100, fontWeight: 700 }}>
          {badge}
        </span>
      )}
    </button>
  );
}

function QuotesPanel({ quotes, loading, onRefresh }: { quotes: Cotizacion[]; loading: boolean; onRefresh: () => void }) {
  const [selected, setSelected] = useState<Cotizacion | null>(null);

  async function markAs(id: string, estado: "pendiente" | "atendida") {
    await supabase.from("quotes").update({ estado }).eq("id", id);
    onRefresh();
    if (selected?.id === id) setSelected((prev) => prev ? { ...prev, estado } : null);
    toast.success(estado === "atendida" ? "Marcada como atendida" : "Reabierta");
  }

  async function deleteQuote(id: string) {
    if (!confirm("¿Eliminar esta cotización? Esta acción no se puede deshacer.")) return;
    await supabase.from("quotes").delete().eq("id", id);
    if (selected?.id === id) setSelected(null);
    onRefresh();
    toast.success("Cotización eliminada");
  }

  if (loading) return <div style={{ padding: 60, textAlign: "center", color: "var(--ink-mute)" }}>Cargando...</div>;

  if (quotes.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: 80, color: "var(--ink-mute)" }}>
        <h3 style={{ margin: "0 0 6px", fontSize: 16, color: "var(--ink)" }}>Sin cotizaciones aún</h3>
        <p>Las pre-cotizaciones de clientes aparecerán aquí</p>
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "360px 1fr", gap: 16 }} className="quotes-layout-responsive">
      {/* List */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: "70vh", overflowY: "auto" }}>
        {quotes.map((q) => (
          <div
            key={q.id}
            onClick={() => setSelected(q)}
            style={{
              background: selected?.id === q.id ? "var(--primary-light)" : "white",
              padding: "12px 14px", borderRadius: "var(--radius)",
              border: `1px solid ${selected?.id === q.id ? "var(--primary)" : "var(--border)"}`,
              cursor: "pointer", transition: "all 0.15s",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontFamily: "monospace", fontSize: 11, color: "var(--ink-soft)" }}>{q.folio}</span>
              <span style={{
                fontSize: 10, padding: "2px 8px", borderRadius: 100, fontWeight: 700, textTransform: "uppercase",
                background: q.estado === "pendiente" ? "var(--accent-soft)" : "#DCFCE7",
                color: q.estado === "pendiente" ? "var(--accent)" : "var(--success)",
              }}>
                {q.estado}
              </span>
            </div>
            <div style={{ fontWeight: 600, marginTop: 4, fontSize: 14 }}>{q.datos.nombre}</div>
            <div style={{ display: "flex", gap: 6, fontSize: 12, color: "var(--ink-mute)", marginTop: 2 }}>
              <span>{q.cart.length} producto{q.cart.length !== 1 ? "s" : ""}</span>
              <span>·</span>
              <span style={{ fontFamily: "monospace", color: "var(--primary)", fontWeight: 600 }}>{formatCurrency(q.total)}</span>
            </div>
            <div style={{ fontSize: 11, color: "var(--ink-soft)", marginTop: 4 }}>{formatDate(q.fecha)}</div>
          </div>
        ))}
      </div>

      {/* Detail */}
      <div style={{ background: "white", borderRadius: "var(--radius-lg)", border: "1px solid var(--border)", padding: 24, minHeight: 500 }}>
        {!selected ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 400, color: "var(--ink-soft)" }}>
            Selecciona una cotización para ver el detalle
          </div>
        ) : (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
              <div>
                <div style={{ fontFamily: "monospace", fontSize: 11, color: "var(--ink-soft)" }}>{selected.folio}</div>
                <h2 style={{ margin: "4px 0", fontSize: 22 }}>{selected.datos.nombre}</h2>
                <div style={{ fontSize: 12, color: "var(--ink-mute)" }}>{formatDate(selected.fecha)}</div>
              </div>
              <span style={{
                fontSize: 11, padding: "4px 12px", borderRadius: 100, fontWeight: 700, textTransform: "uppercase",
                background: selected.estado === "pendiente" ? "var(--accent-soft)" : "#DCFCE7",
                color: selected.estado === "pendiente" ? "var(--accent)" : "var(--success)",
              }}>
                {selected.estado}
              </span>
            </div>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 24 }}>
              <a href={`https://wa.me/${selected.datos.telefono.replace(/\D/g, "")}`} target="_blank" rel="noreferrer"
                style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 12px", background: "var(--whatsapp)", color: "white", borderRadius: 100, fontSize: 12, fontWeight: 600, textDecoration: "none" }}>
                <MessageCircle size={14} /> {selected.datos.telefono}
              </a>
              {selected.datos.email && (
                <a href={`mailto:${selected.datos.email}`}
                  style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 12px", background: "var(--bg)", borderRadius: 100, fontSize: 12, color: "var(--ink)", textDecoration: "none" }}>
                  <Mail size={14} /> {selected.datos.email}
                </a>
              )}
            </div>

            <h4 style={{ fontSize: 12, color: "var(--primary)", textTransform: "uppercase", letterSpacing: "0.04em", margin: "16px 0 8px" }}>
              Productos ({selected.cart.length})
            </h4>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "var(--bg)" }}>
                  {["Código", "Descripción", "Dimensiones", "Cant.", "P. Unit.", "Subtotal"].map((h, i) => (
                    <th key={h} style={{ padding: "8px 10px", textAlign: i >= 3 ? "right" : "left", fontSize: 11, textTransform: "uppercase", color: "var(--ink-mute)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {selected.cart.map((item) => (
                  <tr key={item.codigo}>
                    <td style={{ padding: "8px 10px", fontFamily: "monospace", fontSize: 11, color: "var(--ink-soft)", borderBottom: "1px solid var(--border)" }}>{item.codigo}</td>
                    <td style={{ padding: "8px 10px", borderBottom: "1px solid var(--border)" }}>{item.descripcion}</td>
                    <td style={{ padding: "8px 10px", fontFamily: "monospace", fontSize: 11, borderBottom: "1px solid var(--border)" }}>{item.dimensiones}</td>
                    <td style={{ padding: "8px 10px", textAlign: "right", borderBottom: "1px solid var(--border)" }}>{item.cantidad}</td>
                    <td style={{ padding: "8px 10px", textAlign: "right", fontFamily: "monospace", borderBottom: "1px solid var(--border)" }}>{formatCurrency(item.precio)}</td>
                    <td style={{ padding: "8px 10px", textAlign: "right", fontWeight: 700, fontFamily: "monospace", borderBottom: "1px solid var(--border)" }}>{formatCurrency(item.precio * item.cantidad)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ background: "var(--primary-light)" }}>
                  <td colSpan={5} style={{ padding: "8px 10px", textAlign: "right", fontWeight: 700, color: "var(--primary)" }}>TOTAL ESTIMADO</td>
                  <td style={{ padding: "8px 10px", textAlign: "right", fontWeight: 700, fontFamily: "monospace", color: "var(--primary)" }}>{formatCurrency(selected.total)}</td>
                </tr>
              </tfoot>
            </table>

            {selected.datos.notas && (
              <>
                <h4 style={{ fontSize: 12, color: "var(--primary)", textTransform: "uppercase", letterSpacing: "0.04em", margin: "16px 0 8px" }}>Notas</h4>
                <p style={{ padding: "10px 12px", background: "var(--bg)", borderRadius: 4, fontSize: 13, margin: 0 }}>{selected.datos.notas}</p>
              </>
            )}

            <div style={{ display: "flex", gap: 10, marginTop: 24, paddingTop: 16, borderTop: "1px solid var(--border)", flexWrap: "wrap" }}>
              {selected.estado === "pendiente" ? (
                <button onClick={() => markAs(selected.id!, "atendida")} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 14px", background: "var(--success)", color: "white", borderRadius: "var(--radius)", fontSize: 13, fontWeight: 600 }}>
                  <Check size={14} /> Marcar atendida
                </button>
              ) : (
                <button onClick={() => markAs(selected.id!, "pendiente")} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 14px", background: "white", color: "var(--ink)", border: "1px solid var(--border)", borderRadius: "var(--radius)", fontSize: 13, fontWeight: 500 }}>
                  <RotateCcw size={14} /> Reabrir
                </button>
              )}
              <button onClick={() => deleteQuote(selected.id!)} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 14px", background: "white", color: "var(--danger)", border: "1px solid var(--border)", borderRadius: "var(--radius)", fontSize: 13, fontWeight: 500, marginLeft: "auto" }}>
                <Trash2 size={14} /> Eliminar
              </button>
            </div>
          </>
        )}
      </div>

      <style>{`
        @media (max-width: 900px) { .quotes-layout-responsive { grid-template-columns: 1fr !important; } }
      `}</style>
    </div>
  );
}

function CatalogPanel({ products, onRefresh }: { products: Producto[]; onRefresh: () => void }) {
  const [uploadStatus, setUploadStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [uploadMsg, setUploadMsg] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const categories = products.reduce((acc: Record<string, { total: number; inStock: number }>, p) => {
    if (!acc[p.categoria]) acc[p.categoria] = { total: 0, inStock: 0 };
    acc[p.categoria].total++;
    if (p.stock > 0) acc[p.categoria].inStock++;
    return acc;
  }, {});

  async function handleFile(file: File) {
    setUploadStatus("loading");
    setUploadMsg("Procesando archivo...");
    try {
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(buffer, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows: string[][] = XLSX.utils.sheet_to_json(ws, { header: 1 }) as string[][];

      const headerRow = rows.findIndex((r) =>
        r.some((c) => typeof c === "string" && /codig|descrip/i.test(c))
      );
      if (headerRow === -1) throw new Error("No se encontró fila de encabezados");

      const headers = rows[headerRow].map((h) =>
        String(h ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim()
      );

      const col = (names: string[]) => headers.findIndex((h) => names.some((n) => h.includes(n)));
      const ci = { codigo: col(["codig"]), descripcion: col(["descrip"]), categoria: col(["categ"]), dimensiones: col(["dimens", "medid"]), precio: col(["precio"]), stock: col(["stock", "inventar", "existenc"]), unidad: col(["unidad"]) };

      const parsed: Producto[] = rows.slice(headerRow + 1)
        .filter((r) => r[ci.codigo])
        .map((r) => ({
          codigo: String(r[ci.codigo] ?? "").trim(),
          descripcion: String(r[ci.descripcion] ?? "").trim(),
          categoria: String(r[ci.categoria] ?? "").trim(),
          dimensiones: ci.dimensiones >= 0 ? String(r[ci.dimensiones] ?? "").trim() : "",
          precio: parseFloat(String(r[ci.precio] ?? "0").replace(/[,$]/g, "")) || 0,
          stock: ci.stock >= 0 ? parseInt(String(r[ci.stock] ?? "0")) || 0 : 10,
          unidad: ((ci.unidad >= 0 ? String(r[ci.unidad] ?? "") : "pieza").toLowerCase().includes("hoja") ? "hoja" : "pieza") as "hoja" | "pieza",
        }))
        .filter((p) => p.codigo && p.descripcion);

      await supabase.from("products").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      const { error } = await supabase.from("products").insert(parsed);
      if (error) throw error;

      setUploadStatus("success");
      setUploadMsg(`✓ ${parsed.length} productos cargados correctamente`);
      onRefresh();
    } catch (err) {
      setUploadStatus("error");
      setUploadMsg(`Error: ${err instanceof Error ? err.message : "Archivo inválido"}`);
    }
  }

  async function handleRestore() {
    setUploadStatus("loading");
    setUploadMsg("Restaurando catálogo precargado...");
    try {
      await supabase.from("products").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      await supabase.from("products").insert(CATALOG_DATA);
      setUploadStatus("success");
      setUploadMsg(`✓ Catálogo restaurado (${CATALOG_DATA.length} productos)`);
      onRefresh();
    } catch {
      setUploadStatus("error");
      setUploadMsg("Error al restaurar");
    }
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 20 }} className="catalog-admin-grid">
      <div style={{ background: "white", padding: 24, borderRadius: "var(--radius-lg)", border: "1px solid var(--border)" }}>
        <h3 style={{ margin: "0 0 6px", fontSize: 16 }}>Actualizar catálogo</h3>
        <p style={{ color: "var(--ink-mute)", fontSize: 13, margin: "0 0 16px" }}>
          Sube un archivo <code style={{ background: "var(--bg)", padding: "1px 6px", borderRadius: 3, fontSize: 11, color: "var(--primary)" }}>.xlsx</code> con columnas: Código, Descripción, Categoría, Dimensiones, Precio, Stock, Unidad.
        </p>
        <input ref={fileRef} type="file" accept=".xlsx,.xls" style={{ display: "none" }} onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
        <label
          onClick={() => fileRef.current?.click()}
          style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "14px 22px", background: "var(--primary)", color: "white", borderRadius: "var(--radius)", fontWeight: 600, cursor: "pointer", transition: "all 0.15s" }}
        >
          <Upload size={16} /> Seleccionar archivo .xlsx
        </label>

        {uploadStatus !== "idle" && (
          <div style={{
            marginTop: 12, padding: "10px 14px", borderRadius: 6, fontSize: 13,
            background: uploadStatus === "success" ? "#DCFCE7" : uploadStatus === "error" ? "#FEE2E2" : "var(--primary-light)",
            color: uploadStatus === "success" ? "var(--success)" : uploadStatus === "error" ? "var(--danger)" : "var(--primary)",
            border: `1px solid ${uploadStatus === "success" ? "#86EFAC" : uploadStatus === "error" ? "#FCA5A5" : "var(--primary-soft)"}`,
          }}>
            {uploadMsg}
          </div>
        )}

        <button onClick={handleRestore} style={{ display: "block", marginTop: 16, color: "var(--ink-mute)", fontSize: 12, textDecoration: "underline" }}>
          Restaurar catálogo precargado ({CATALOG_DATA.length} productos)
        </button>
      </div>

      <div style={{ background: "white", padding: 24, borderRadius: "var(--radius-lg)", border: "1px solid var(--border)" }}>
        <h4 style={{ margin: "0 0 12px", fontSize: 13, color: "var(--primary)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
          Resumen del catálogo
        </h4>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {Object.entries(categories).map(([cat, stats]) => (
            <div key={cat} style={{ padding: "10px 12px", background: "var(--bg)", borderRadius: 6 }}>
              <div style={{ fontWeight: 600, fontSize: 13 }}>{cat}</div>
              <div style={{ fontSize: 11, color: "var(--ink-mute)", marginTop: 2 }}>
                {stats.inStock} en stock / {stats.total} total
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`@media (max-width: 900px) { .catalog-admin-grid { grid-template-columns: 1fr !important; } }`}</style>
    </div>
  );
}

function EmpresaPanel() {
  const { empresa, saveEmpresa } = useEmpresa();
  const [form, setForm] = useState<Empresa>(empresa);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    await saveEmpresa(form);
    setSaving(false);
    toast.success("Datos guardados correctamente");
  }

  return (
    <div style={{ maxWidth: 600, background: "white", padding: 28, borderRadius: "var(--radius-lg)", border: "1px solid var(--border)" }}>
      <h3 style={{ margin: "0 0 6px" }}>Datos de la empresa</h3>
      <p style={{ color: "var(--ink-mute)", fontSize: 13, margin: "0 0 20px" }}>Aparecen en el encabezado del PDF de pre-cotización</p>

      {(["nombre", "giro", "direccion", "telefono", "whatsapp"] as const).map((field) => (
        <div key={field} style={{ marginBottom: 16 }}>
          <label style={{ display: "block", fontSize: 12, color: "var(--ink-mute)", marginBottom: 6, fontWeight: 500, textTransform: "capitalize" }}>
            {field === "whatsapp" ? "WhatsApp (con LADA)" : field === "giro" ? "Giro / ramo" : field}
          </label>
          <input
            value={form[field] || ""}
            onChange={(e) => setForm({ ...form, [field]: e.target.value })}
            style={{ width: "100%", padding: "10px 12px", border: "1px solid var(--border)", borderRadius: 6, outline: "none" }}
          />
        </div>
      ))}

      <button
        onClick={handleSave}
        disabled={saving}
        style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          background: "var(--primary)", color: "white", padding: "12px 20px",
          borderRadius: "var(--radius)", fontWeight: 600, fontSize: 14, opacity: saving ? 0.7 : 1,
        }}
      >
        <Save size={16} /> {saving ? "Guardando..." : "Guardar cambios"}
      </button>
    </div>
  );
}
