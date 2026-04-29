"use client";

import { useState, useMemo, useRef } from "react";
import { Search, X, LayoutGrid, List, ShoppingCart, ZoomIn } from "lucide-react";
import { Producto } from "@/lib/types";
import { fuzzyScore, permiteMediosTramos, permiteCorte, tieneMedidasEspecialesVidrio, generarOpcionesCantidad } from "@/lib/utils";
import { useCart } from "@/lib/cart-context";
import GlassRender from "@/components/glass-render";
import CartDrawer from "./cart-drawer";
import Lightbox from "./lightbox";
import { toast } from "sonner";

type Props = {
  products: Producto[];
  onCheckout: () => void;
};

export default function CatalogView({ products, onCheckout }: Props) {
  const [query, setQuery] = useState("");
  const [activeGrupo, setActiveGrupo] = useState("Todos");
  const [activeSub, setActiveSub] = useState("Todos");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [lightboxVariants, setLightboxVariants] = useState<Producto[] | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const { items, count, add } = useCart();

  const visibleProducts = products.filter((p) => p.stock > 0);

  // Agrupar por descripción para mostrar un producto por descripción única
  const productGroups = useMemo(() => {
    const groups: Record<string, Producto[]> = {};
    visibleProducts.forEach((p) => {
      if (!groups[p.descripcion]) groups[p.descripcion] = [];
      groups[p.descripcion].push(p);
    });
    return groups;
  }, [visibleProducts]);

  // Lista de productos "representantes" (uno por descripción)
  const representatives = useMemo(() => {
    return Object.values(productGroups).map((variants) => {
      // Preferir el que tenga imagen, o el primero
      return variants.find((v) => v.imagen) || variants[0];
    });
  }, [productGroups]);

  // Extraer filtros únicos
  const grupos = useMemo(() => {
    const set = new Set(representatives.map((p) => p.grupo));
    return Array.from(set).sort();
  }, [representatives]);

  const subs = useMemo(() => {
    const set = new Set(representatives.map((p) => p.subclasificacion).filter(Boolean));
    return Array.from(set).sort();
  }, [representatives]);

  // Filtrado
  const filtered = useMemo(() => {
    let list = representatives;
    if (activeGrupo !== "Todos") list = list.filter((p) => p.grupo === activeGrupo);
    if (activeSub !== "Todos") list = list.filter((p) => p.subclasificacion === activeSub);
    if (!query.trim()) return list;
    return list
      .map((p) => ({ p, score: fuzzyScore(query, p) }))
      .filter((x) => x.score > 10)
      .sort((a, b) => b.score - a.score)
      .map((x) => x.p);
  }, [representatives, activeGrupo, activeSub, query]);

  const suggestions = useMemo(() => {
    if (!query.trim() || query.length < 2) return [];
    return representatives
      .map((p) => ({ p, score: fuzzyScore(query, p) }))
      .filter((x) => x.score > 10)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map((x) => x.p);
  }, [query, representatives]);

  function handleAddToCart(product: Producto, cantidad: number, corte?: "horizontal" | "vertical") {
    add(product, cantidad, corte);
    toast.success(`${product.descripcion} agregado al carrito`);
  }

  function handleZoom(product: Producto) {
    const variants = productGroups[product.descripcion] || [product];
    setLightboxVariants(variants);
  }

  const groupedByGrupo = useMemo(() => {
    const groups: Record<string, Producto[]> = {};
    filtered.forEach((p) => {
      if (!groups[p.grupo]) groups[p.grupo] = [];
      groups[p.grupo].push(p);
    });
    return groups;
  }, [filtered]);

  return (
    <main style={{ flex: 1 }}>
      <div style={{ maxWidth: 1400, margin: "0 auto", padding: "24px" }}>
        {/* Hero */}
        <div style={{
          background: "linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)",
          borderRadius: "var(--radius-lg)", padding: "32px 36px", color: "white",
          marginBottom: 20, display: "grid", gridTemplateColumns: "1fr 1.4fr", gap: 32, alignItems: "center",
        }}
          className="catalog-hero-grid"
        >
          <div>
            <h1 style={{ margin: 0, fontSize: 28, fontWeight: 700, letterSpacing: "-0.02em" }}>
              Cotizador en línea
            </h1>
            <p style={{ margin: "8px 0 0", fontSize: 14, opacity: 0.85, lineHeight: 1.5 }}>
              Explora nuestro catálogo, elige los productos y genera tu pre-cotización al instante.
            </p>
          </div>
          {/* Search */}
          <div ref={searchRef} style={{ position: "relative" }}>
            <div style={{
              position: "relative", background: "white", borderRadius: "var(--radius)",
              display: "flex", alignItems: "center", padding: "0 16px", height: 52,
              boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
            }}>
              <Search size={18} color="var(--ink-mute)" />
              <input
                value={query}
                onChange={(e) => { setQuery(e.target.value); setShowSuggestions(true); }}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                placeholder="Buscar por código, descripción, grupo..."
                style={{
                  flex: 1, border: "none", outline: "none", background: "transparent",
                  padding: "0 12px", fontSize: 15, color: "var(--ink)",
                }}
              />
              {query && (
                <button onClick={() => setQuery("")} style={{
                  width: 26, height: 26, borderRadius: "50%", background: "var(--bg)",
                  color: "var(--ink-mute)", display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <X size={14} />
                </button>
              )}
            </div>
            {showSuggestions && suggestions.length > 0 && query.length >= 2 && (
              <div style={{
                position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0,
                background: "white", borderRadius: "var(--radius)", boxShadow: "var(--shadow-lg)",
                overflow: "hidden", zIndex: 10,
              }}>
                {suggestions.map((p) => (
                  <div
                    key={p.codigo}
                    onMouseDown={() => { setQuery(p.descripcion); setShowSuggestions(false); }}
                    style={{
                      display: "flex", alignItems: "center", gap: 10, padding: "11px 16px",
                      fontSize: 13, color: "var(--ink)", cursor: "pointer",
                    }}
                    className="suggestion-item"
                  >
                    <Search size={12} color="var(--ink-soft)" />
                    <span><strong>{p.descripcion}</strong> — {p.grupo}</span>
                    <span style={{ marginLeft: "auto", fontFamily: "monospace", fontSize: 11, color: "var(--ink-soft)" }}>
                      {p.codigo}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Filters */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, gap: 16, flexWrap: "wrap" }}>
          <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
            <FilterSelect
              label="Grupo"
              value={activeGrupo}
              options={["Todos", ...grupos]}
              counts={{ "Todos": representatives.length, ...Object.fromEntries(grupos.map(g => [g, representatives.filter(p => p.grupo === g).length])) }}
              onChange={setActiveGrupo}
            />
            <FilterSelect
              label="Sub clasificación"
              value={activeSub}
              options={["Todos", ...subs]}
              onChange={setActiveSub}
            />
            {(activeGrupo !== "Todos" || activeSub !== "Todos") && (
              <button
                onClick={() => { setActiveGrupo("Todos"); setActiveSub("Todos"); }}
                style={{
                  display: "flex", alignItems: "center", gap: 4,
                  fontSize: 12, color: "var(--primary)", fontWeight: 600,
                  padding: "6px 10px", background: "var(--primary-light)",
                  borderRadius: 6, border: "none", cursor: "pointer",
                }}
              >
                <X size={12} /> Limpiar filtros
              </button>
            )}
          </div>
          <div style={{ display: "flex", gap: 0, background: "white", border: "1px solid var(--border)", borderRadius: "var(--radius)", overflow: "hidden", flexShrink: 0 }}>
            <ViewBtn active={viewMode === "grid"} onClick={() => setViewMode("grid")} icon={<LayoutGrid size={15} />} label="Mosaico" />
            <ViewBtn active={viewMode === "list"} onClick={() => setViewMode("list")} icon={<List size={15} />} label="Lista" />
          </div>
        </div>

        {/* Results info */}
        {query && (
          <div style={{ fontSize: 13, color: "var(--ink-mute)", marginBottom: 12 }}>
            <strong style={{ color: "var(--primary)" }}>{filtered.length}</strong> resultado{filtered.length !== 1 ? "s" : ""} para{" "}
            <em style={{ color: "var(--ink)", fontStyle: "normal" }}>&ldquo;{query}&rdquo;</em>
          </div>
        )}

        {/* Products */}
        {filtered.length === 0 ? (
          <EmptyState onClear={() => { setQuery(""); setActiveGrupo("Todos"); setActiveSub("Todos"); }} />
        ) : viewMode === "grid" ? (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: 16,
          }}>
            {filtered.map((p) => (
              <ProductCard
                key={p.descripcion}
                product={p}
                variants={productGroups[p.descripcion] || [p]}
                onAdd={handleAddToCart}
                onZoom={() => handleZoom(p)}
              />
            ))}
          </div>
        ) : (
          <ListView groups={groupedByGrupo} onAdd={handleAddToCart} onZoom={handleZoom} />
        )}
      </div>

      {/* Cart FAB */}
      {count > 0 && (
        <button
          onClick={() => setDrawerOpen(true)}
          style={{
            position: "fixed", bottom: 24, right: 24, zIndex: 50,
            display: "flex", alignItems: "center", gap: 14,
            padding: "14px 22px", background: "var(--primary)", color: "white",
            borderRadius: 100, boxShadow: "var(--shadow-lg)",
            fontWeight: 600, fontSize: 14, transition: "all 0.2s",
          }}
        >
          <ShoppingCart size={18} />
          <span style={{ background: "var(--accent)", padding: "2px 9px", borderRadius: 100, fontSize: 12, fontWeight: 700 }}>
            {count}
          </span>
          <span style={{ fontWeight: 600, paddingLeft: 10, borderLeft: "1px solid rgba(255,255,255,0.25)" }}>
            Ver pre-cotización →
          </span>
        </button>
      )}

      {/* Cart Drawer */}
      {drawerOpen && (
        <CartDrawer
          onClose={() => setDrawerOpen(false)}
          onCheckout={() => { setDrawerOpen(false); onCheckout(); }}
        />
      )}

      {/* Lightbox */}
      {lightboxVariants && (
        <Lightbox
          variants={lightboxVariants}
          onClose={() => setLightboxVariants(null)}
          onAdd={(p, qty) => handleAddToCart(p, qty)}
        />
      )}

      <style>{`
        .suggestion-item:hover { background: var(--primary-light); color: var(--primary); }
        @media (max-width: 900px) {
          .catalog-hero-grid { grid-template-columns: 1fr !important; gap: 20px !important; padding: 24px !important; }
        }
      `}</style>
    </main>
  );
}

function FilterSelect({ label, value, options, counts, onChange }: {
  label: string;
  value: string;
  options: string[];
  counts?: Record<string, number>;
  onChange: (v: string) => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <label style={{ fontSize: 11, color: "var(--ink-soft)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          padding: "8px 28px 8px 12px",
          borderRadius: "var(--radius)",
          border: "1px solid var(--border)",
          background: "white",
          fontSize: 13,
          color: "var(--ink)",
          fontWeight: 500,
          minWidth: 180,
          cursor: "pointer",
          outline: "none",
        }}
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt} {counts && counts[opt] !== undefined ? `(${counts[opt]})` : ""}
          </option>
        ))}
      </select>
    </div>
  );
}

function ViewBtn({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: 6,
        padding: "8px 14px", fontSize: 13, color: active ? "white" : "var(--ink-mute)", fontWeight: 500,
        background: active ? "var(--primary)" : "transparent",
      }}
    >
      {icon} {label}
    </button>
  );
}

function ProductCard({ product: p, variants, onAdd, onZoom }: { product: Producto; variants: Producto[]; onAdd: (p: Producto, qty: number, corte?: "horizontal" | "vertical") => void; onZoom: () => void }) {
  const [qty, setQty] = useState(1);
  const [corte, setCorte] = useState<"horizontal" | "vertical">("horizontal");
  const hasMultipleColors = variants.length > 1;
  const colorLabel = hasMultipleColors ? `${variants.length} acabados` : p.color;

  const esVidrioEspecial = permiteCorte(p.grupo) && tieneMedidasEspecialesVidrio(p.descripcion);
  const esMedioTramo = permiteMediosTramos(p.grupo) || (permiteCorte(p.grupo) && !esVidrioEspecial);
  const opcionesVidrio = esVidrioEspecial ? generarOpcionesCantidad(p.stock, true) : [];
  const muestraCorte = permiteCorte(p.grupo) && qty === 0.5;

  return (
    <div style={{
      background: "white", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)",
      overflow: "hidden", transition: "all 0.2s", display: "flex", flexDirection: "column",
    }}
      className="product-card"
    >
      {/* Image */}
      <div
        onClick={onZoom}
        style={{
          position: "relative", height: 180, cursor: "zoom-in",
          background: p.imagen ? "white" : "linear-gradient(135deg, #F0F4F8 0%, #DCE5ED 100%)",
          overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center",
        }}
      >
        {p.imagen ? (
          <img
            src={p.imagen}
            alt={p.descripcion}
            style={{ width: "100%", height: "100%", objectFit: "contain", padding: 8 }}
          />
        ) : (
          <div style={{ width: "80%", height: "80%" }}>
            <GlassRender categoria={p.grupo} descripcion={p.descripcion} size="md" />
          </div>
        )}
        <div className="zoom-hint" style={{
          position: "absolute", top: 10, right: 10,
          background: "rgba(15,61,110,0.85)", color: "white",
          width: 30, height: 30, borderRadius: "50%",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <ZoomIn size={14} />
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: 14, flex: 1, display: "flex", flexDirection: "column" }}>
        <span style={{ fontFamily: "monospace", fontSize: 11, color: "var(--ink-soft)", letterSpacing: "0.02em" }}>
          {p.codigo}
        </span>
        <div style={{ fontSize: 15, fontWeight: 600, color: "var(--ink)", marginTop: 4, lineHeight: 1.3 }}>
          {p.descripcion}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8, fontSize: 11, color: "var(--ink-mute)", flexWrap: "wrap" }}>
          <span style={{ background: "var(--primary-light)", color: "var(--primary)", padding: "2px 8px", borderRadius: 100, fontWeight: 600, fontSize: 10, letterSpacing: "0.02em", textTransform: "uppercase" }}>
            {p.grupo}
          </span>
          {p.subclasificacion && (
            <span style={{ color: "var(--ink-mute)", fontSize: 10 }}>{p.subclasificacion}</span>
          )}
        </div>

        <div style={{ marginTop: "auto", paddingTop: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, marginBottom: 8 }}>
            <span style={{
              width: 7, height: 7, borderRadius: "50%", background: "var(--success)",
              boxShadow: "0 0 0 3px color-mix(in srgb, var(--success) 20%, transparent)",
            }} />
            <span style={{ color: "var(--ink-mute)", fontWeight: 500 }}>
              {colorLabel} · En stock
            </span>
          </div>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            {esVidrioEspecial ? (
              <select
                value={qty}
                onChange={(e) => setQty(parseFloat(e.target.value))}
                style={{ padding: "6px 8px", borderRadius: 6, border: "1px solid var(--border)", fontSize: 13, fontWeight: 600, minWidth: 60 }}
              >
                {opcionesVidrio.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            ) : (
              <div style={{ display: "flex", alignItems: "center", border: "1px solid var(--border)", borderRadius: 6, overflow: "hidden", height: 30 }}>
                <button onClick={() => setQty(Math.max(esMedioTramo ? 0.5 : 1, qty - (esMedioTramo ? 0.5 : 1)))} style={{ width: 26, height: 28, background: "var(--bg)", color: "var(--ink)", fontSize: 14, fontWeight: 600 }}>−</button>
                <input
                  type="number" value={qty} min={esMedioTramo ? 0.5 : 1} max={p.stock} step={esMedioTramo ? 0.5 : 1}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    const min = esMedioTramo ? 0.5 : 1;
                    setQty(Math.max(min, Math.min(p.stock, isNaN(val) ? min : val)));
                  }}
                  style={{ width: 40, textAlign: "center", border: "none", outline: "none", fontSize: 13, fontWeight: 600, padding: 0 }}
                />
                <button onClick={() => setQty(Math.min(p.stock, qty + (esMedioTramo ? 0.5 : 1)))} style={{ width: 26, height: 28, background: "var(--bg)", color: "var(--ink)", fontSize: 14, fontWeight: 600 }}>+</button>
              </div>
            )}
            <button
              onClick={() => onAdd(p, qty, muestraCorte ? corte : undefined)}
              style={{
                display: "flex", alignItems: "center", gap: 5,
                padding: "7px 12px", background: "var(--primary)", color: "white",
                borderRadius: 6, fontSize: 12, fontWeight: 600, transition: "all 0.15s",
              }}
            >
              + Agregar
            </button>
          </div>
          {muestraCorte && (
            <div style={{ marginTop: 8, padding: 8, background: "var(--primary-light)", borderRadius: 6, border: "1px solid var(--primary-soft)" }}>
              <label style={{ display: "block", fontSize: 10, color: "var(--primary)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 4 }}>Definir corte</label>
              <div style={{ display: "flex", gap: 6 }}>
                {(["horizontal", "vertical"] as const).map((dir) => (
                  <button
                    key={dir}
                    onClick={() => setCorte(dir)}
                    style={{
                      flex: 1, padding: "4px 8px", borderRadius: 4, fontSize: 11, fontWeight: 600,
                      border: `2px solid ${corte === dir ? "var(--primary)" : "var(--border)"}`,
                      background: corte === dir ? "white" : "transparent",
                      color: corte === dir ? "var(--primary)" : "var(--ink)",
                      textTransform: "capitalize", cursor: "pointer",
                    }}
                  >
                    {dir}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`.product-card:hover { transform: translateY(-2px); box-shadow: var(--shadow); border-color: var(--border-strong) !important; }
      .product-card .zoom-hint { opacity: 0; transform: scale(0.8); transition: all 0.2s; }
      .product-card:hover .zoom-hint { opacity: 1 !important; transform: scale(1) !important; }`}</style>
    </div>
  );
}

function ListView({ groups, onAdd, onZoom }: {
  groups: Record<string, Producto[]>;
  onAdd: (p: Producto, qty: number, corte?: "horizontal" | "vertical") => void;
  onZoom: (p: Producto) => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {Object.entries(groups).map(([grupo, products]) => (
        <div key={grupo} style={{ background: "white", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
          <div style={{
            padding: "14px 20px",
            background: "linear-gradient(135deg, var(--primary-light) 0%, white 100%)",
            borderBottom: "1px solid var(--border)",
            display: "flex", justifyContent: "space-between", alignItems: "center",
          }}>
            <h3 style={{ margin: 0, fontSize: 15, color: "var(--primary)", fontWeight: 700 }}>{grupo}</h3>
            <span style={{ fontSize: 12, color: "var(--ink-mute)" }}>{products.length} productos</span>
          </div>
          <div>
            {products.map((p) => (
              <ListRow key={p.descripcion} product={p} onAdd={onAdd} onZoom={onZoom} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function ListRow({ product: p, onAdd, onZoom }: { product: Producto; onAdd: (p: Producto, qty: number, corte?: "horizontal" | "vertical") => void; onZoom: (p: Producto) => void }) {
  const [qty, setQty] = useState(1);
  const [corte, setCorte] = useState<"horizontal" | "vertical">("horizontal");
  const esVidrioEspecial = permiteCorte(p.grupo) && tieneMedidasEspecialesVidrio(p.descripcion);
  const esMedioTramo = permiteMediosTramos(p.grupo) || (permiteCorte(p.grupo) && !esVidrioEspecial);
  const opcionesVidrio = esVidrioEspecial ? generarOpcionesCantidad(p.stock, true) : [];
  const minQty = esMedioTramo ? 0.5 : 1;
  const stepQty = esMedioTramo ? 0.5 : 1;
  const muestraCorte = permiteCorte(p.grupo) && qty === 0.5;

  return (
    <div style={{
      display: "grid", gridTemplateColumns: "64px 90px 1fr 130px 80px 100px auto",
      gap: 12, padding: "8px 16px", alignItems: "center",
      borderBottom: "1px solid var(--border)", fontSize: 13, transition: "background 0.1s",
    }}
      className="list-row-hover"
    >
      <div onClick={() => onZoom(p)} style={{ height: 48, cursor: "zoom-in", borderRadius: 4, overflow: "hidden", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        {p.imagen
          ? <img src={p.imagen} alt={p.descripcion} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
          : <GlassRender categoria={p.grupo} descripcion={p.descripcion} size="sm" />
        }
      </div>
      <span style={{ fontFamily: "monospace", fontSize: 11, color: "var(--ink-mute)" }}>{p.codigo}</span>
      <span style={{ fontWeight: 500 }}>{p.descripcion}</span>
      <span style={{ color: "var(--ink-mute)", fontSize: 11 }}>{p.subclasificacion || "—"}</span>
      <span style={{ fontSize: 11, color: "var(--success)", fontWeight: 500 }}>En stock</span>
      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
        {esVidrioEspecial ? (
          <select
            value={qty}
            onChange={(e) => setQty(parseFloat(e.target.value))}
            style={{ padding: "4px 6px", borderRadius: 4, border: "1px solid var(--border)", fontSize: 12, fontWeight: 600, minWidth: 50 }}
          >
            {opcionesVidrio.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        ) : (
          <div style={{ display: "flex", alignItems: "center", border: "1px solid var(--border)", borderRadius: 6, overflow: "hidden", height: 26 }}>
            <button onClick={() => setQty(Math.max(minQty, parseFloat((qty - stepQty).toFixed(2))))} style={{ width: 22, height: 24, background: "var(--bg)", color: "var(--ink)", fontSize: 12, fontWeight: 600 }}>−</button>
            <span style={{ display: "inline-block", minWidth: 28, textAlign: "center", fontSize: 12, fontWeight: 600 }}>{qty}</span>
            <button onClick={() => setQty(Math.min(p.stock, parseFloat((qty + stepQty).toFixed(2))))} style={{ width: 22, height: 24, background: "var(--bg)", color: "var(--ink)", fontSize: 12, fontWeight: 600 }}>+</button>
          </div>
        )}
        <button onClick={() => onAdd(p, qty, muestraCorte ? corte : undefined)} style={{ padding: "5px 10px", background: "var(--primary)", color: "white", borderRadius: 6, fontSize: 12, fontWeight: 600 }}>
          + Agregar
        </button>
      </div>
      {muestraCorte && (
        <div style={{ gridColumn: "1 / -1", marginTop: 4, padding: "6px 10px", background: "var(--primary-light)", borderRadius: 4, border: "1px solid var(--primary-soft)" }}>
          <label style={{ fontSize: 10, color: "var(--primary)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", marginRight: 8 }}>Definir corte</label>
          {(["horizontal", "vertical"] as const).map((dir) => (
            <button
              key={dir}
              onClick={() => setCorte(dir)}
              style={{
                padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 600,
                border: `2px solid ${corte === dir ? "var(--primary)" : "var(--border)"}`,
                background: corte === dir ? "white" : "transparent",
                color: corte === dir ? "var(--primary)" : "var(--ink)",
                textTransform: "capitalize", cursor: "pointer", marginRight: 6,
              }}
            >
              {dir}
            </button>
          ))}
        </div>
      )}
      <style>{`.list-row-hover:hover { background: var(--bg); }`}</style>
    </div>
  );
}

function EmptyState({ onClear }: { onClear: () => void }) {
  return (
    <div style={{ textAlign: "center", padding: "80px 20px", color: "var(--ink-mute)" }}>
      <Search size={48} color="var(--ink-soft)" style={{ marginBottom: 16 }} />
      <p style={{ margin: "8px 0 16px", fontSize: 15 }}>No se encontraron productos</p>
      <button onClick={onClear} style={{
        color: "var(--primary)", fontWeight: 600, padding: "8px 16px",
        border: "1px solid var(--primary)", borderRadius: 6,
      }}>
        Limpiar filtros
      </button>
    </div>
  );
}
