"use client";

import { X } from "lucide-react";
import { useCart } from "@/lib/cart-context";
import GlassRender from "@/components/glass-render";

type Props = {
  onClose: () => void;
  onCheckout: () => void;
};

export default function CartDrawer({ onClose, onCheckout }: Props) {
  const { items, count, remove, updateQty } = useCart();

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: "fixed", inset: 0, background: "rgba(15, 35, 50, 0.5)",
        display: "flex", justifyContent: "flex-end", zIndex: 100,
      }}
      className="animate-fadein"
    >
      <div style={{
        width: 480, maxWidth: "100vw", background: "white", height: "100vh",
        display: "flex", flexDirection: "column",
      }}
        className="animate-slidein"
      >
        {/* Head */}
        <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "var(--ink)" }}>
            Tu pre-cotización ({items.length} {items.length === 1 ? "producto" : "productos"})
          </h2>
          <button onClick={onClose} style={{ fontSize: 28, color: "var(--ink-mute)", width: 32, height: 32, borderRadius: 6, lineHeight: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 24px" }}>
          {items.length === 0 ? (
            <div style={{ textAlign: "center", color: "var(--ink-mute)", padding: "60px 0" }}>
              <p>Tu carrito está vacío</p>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.codigo} style={{
                display: "grid", gridTemplateColumns: "56px 1fr auto",
                gap: 14, padding: "14px 0", borderBottom: "1px solid var(--border)",
              }}>
                <div style={{ height: 56, borderRadius: 6, overflow: "hidden", background: "var(--bg)" }}>
                  <GlassRender categoria={item.grupo} descripcion={item.descripcion} size="sm" />
                </div>
                <div>
                  <div style={{ fontFamily: "monospace", fontSize: 10, color: "var(--ink-soft)" }}>{item.codigo}</div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{item.descripcion}</div>
                  <div style={{ fontSize: 11, color: "var(--ink-mute)", marginTop: 2 }}>
                    {item.grupo} · {item.subclasificacion}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--ink-soft)", marginTop: 2 }}>
                    Color: <strong>{item.color}</strong>
                  </div>
                  {item.corte && (
                    <div style={{ fontSize: 11, color: "var(--primary)", marginTop: 2, fontWeight: 600 }}>
                      Corte: {item.corte}
                    </div>
                  )}
                  <div style={{ fontSize: 12, color: "var(--ink-mute)", marginTop: 4 }}>
                    Cantidad: {item.cantidad}
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
                  <div style={{ display: "flex", alignItems: "center", border: "1px solid var(--border)", borderRadius: 6, overflow: "hidden", height: 26 }}>
                    <button onClick={() => updateQty(item.codigo, item.cantidad - 1)} style={{ width: 22, height: 24, background: "var(--bg)", fontSize: 12, fontWeight: 600 }}>−</button>
                    <span style={{ display: "inline-block", minWidth: 22, textAlign: "center", fontSize: 12, fontWeight: 600 }}>{item.cantidad}</span>
                    <button onClick={() => updateQty(item.codigo, item.cantidad + 1)} style={{ width: 22, height: 24, background: "var(--bg)", fontSize: 12, fontWeight: 600 }}>+</button>
                  </div>
                  <button onClick={() => remove(item.codigo)} style={{ color: "var(--danger)", fontSize: 11, fontWeight: 500 }}>
                    Eliminar
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div style={{ padding: "20px 24px", borderTop: "1px solid var(--border)", background: "var(--bg)" }}>
            <div style={{ fontSize: 11, color: "var(--ink-mute)", padding: "10px 12px", background: "#FFF8E1", borderLeft: "3px solid var(--warning)", borderRadius: 4, marginBottom: 12 }}>
              <strong style={{ color: "#5C4310" }}>Pre-cotización:</strong> Los precios están sujetos a confirmación de stock y validación por el equipo de ventas.
            </div>
            <button
              onClick={onCheckout}
              style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                background: "var(--primary)", color: "white",
                padding: "14px 22px", borderRadius: "var(--radius)",
                fontWeight: 600, fontSize: 15, width: "100%", transition: "all 0.15s",
              }}
            >
              Continuar a datos de contacto →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
