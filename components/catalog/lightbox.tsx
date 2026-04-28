"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { Producto } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import GlassRender from "@/components/glass-render";

type Props = {
  product: Producto;
  onClose: () => void;
  onAdd: (p: Producto, qty: number) => void;
};

export default function Lightbox({ product: p, onClose, onAdd }: Props) {
  const [qty, setQty] = useState(1);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: "fixed", inset: 0, background: "rgba(15, 35, 50, 0.85)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 100, padding: 24,
      }}
      className="animate-fadein"
    >
      <div style={{
        background: "white", borderRadius: "var(--radius-lg)", overflow: "hidden",
        display: "grid", gridTemplateColumns: "1.2fr 1fr",
        maxWidth: 1000, width: "100%", maxHeight: "90vh",
        position: "relative",
      }}
        className="animate-zoomin lightbox-inner"
      >
        <button
          onClick={onClose}
          style={{
            position: "absolute", top: 12, right: 12, zIndex: 5,
            width: 36, height: 36, borderRadius: "50%",
            background: "white", color: "var(--ink)", fontSize: 22, lineHeight: 1,
            boxShadow: "var(--shadow)", display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <X size={18} />
        </button>

        {/* Image */}
        <div style={{
          background: "linear-gradient(135deg, #E8EEF3 0%, #C8D6E0 100%)",
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: 32, minHeight: 480,
        }}>
          <GlassRender categoria={p.categoria} descripcion={p.descripcion} size="lg" />
        </div>

        {/* Info */}
        <div style={{ padding: 32, display: "flex", flexDirection: "column", overflowY: "auto" }}>
          <span style={{ fontFamily: "monospace", fontSize: 12, color: "var(--ink-soft)" }}>{p.codigo}</span>
          <h2 style={{ margin: "6px 0 4px", fontSize: 24, fontWeight: 700, color: "var(--ink)", letterSpacing: "-0.02em" }}>
            {p.descripcion}
          </h2>
          <span style={{ color: "var(--primary)", fontSize: 13, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>
            {p.categoria}
          </span>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "18px 24px", margin: "24px 0" }}>
            <InfoField label="Dimensiones" value={<span style={{ fontFamily: "monospace" }}>{p.dimensiones}</span>} />
            <InfoField label="Unidad" value={p.unidad} />
            <InfoField
              label="Stock disponible"
              value={
                <span style={{ color: p.stock <= 5 ? "var(--warning)" : "var(--success)", fontWeight: 600 }}>
                  {p.stock <= 5 ? `Quedan ${p.stock}` : p.stock} {p.unidad}{p.stock !== 1 ? "s" : ""}
                </span>
              }
            />
            <InfoField
              label="Precio estimado"
              value={<span style={{ fontSize: 22, fontWeight: 700, color: "var(--primary)" }}>{formatCurrency(p.precio)}</span>}
            />
          </div>

          <div style={{ marginTop: "auto", display: "flex", gap: 10, alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", border: "1px solid var(--border)", borderRadius: 6, overflow: "hidden", height: 38 }}>
              <button onClick={() => setQty(Math.max(1, qty - 1))} style={{ width: 32, height: 36, background: "var(--bg)", fontSize: 16, fontWeight: 600 }}>−</button>
              <input
                type="number" value={qty} min={1} max={p.stock}
                onChange={(e) => setQty(Math.max(1, Math.min(p.stock, parseInt(e.target.value) || 1)))}
                style={{ width: 44, textAlign: "center", border: "none", outline: "none", fontSize: 14, fontWeight: 600 }}
              />
              <button onClick={() => setQty(Math.min(p.stock, qty + 1))} style={{ width: 32, height: 36, background: "var(--bg)", fontSize: 16, fontWeight: 600 }}>+</button>
            </div>
            <button
              onClick={() => { onAdd(p, qty); onClose(); }}
              style={{
                flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                padding: "10px 18px", background: "var(--primary)", color: "white",
                borderRadius: "var(--radius)", fontWeight: 600, fontSize: 14, transition: "all 0.15s",
              }}
            >
              + Agregar al carrito
            </button>
          </div>

          <p style={{ fontSize: 11, color: "var(--ink-soft)", marginTop: 16, paddingTop: 16, borderTop: "1px solid var(--border)" }}>
            Precios sujetos a confirmación. Esta es una pre-cotización.
          </p>
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .lightbox-inner { grid-template-columns: 1fr !important; max-height: 95vh; overflow-y: auto; }
        }
      `}</style>
    </div>
  );
}

function InfoField({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: "block", fontSize: 11, color: "var(--ink-soft)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>
        {label}
      </label>
      <div style={{ fontSize: 15, fontWeight: 500, color: "var(--ink)" }}>{value}</div>
    </div>
  );
}
