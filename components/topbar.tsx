"use client";

import { Lock } from "lucide-react";

export default function Topbar() {
  return (
    <header style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "12px 24px", background: "var(--surface)",
      borderBottom: "1px solid var(--border)", position: "sticky", top: 0, zIndex: 30,
      boxShadow: "var(--shadow-sm)",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <LogoMark />
        <div>
          <div className="brand-name" style={{ fontWeight: 700, fontSize: 15, color: "var(--primary)", letterSpacing: "-0.01em" }}>
            Vidrios y Aluminio El Castillo
          </div>
          <div style={{ fontSize: 11, color: "var(--ink-mute)", textTransform: "uppercase", letterSpacing: "0.08em", marginTop: 1 }}>
            Cotizador en línea
          </div>
        </div>
      </div>

      <a
        href="/login"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "6px 12px",
          borderRadius: 6,
          fontSize: 12,
          fontWeight: 500,
          color: "var(--ink-soft)",
          background: "var(--bg)",
          border: "1px solid var(--border)",
          textDecoration: "none",
          transition: "all 0.15s",
        }}
        title="Acceso administrador"
      >
        <Lock size={13} />
        <span>Admin</span>
      </a>
    </header>
  );
}

function LogoMark() {
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="36" height="36" rx="8" fill="#0F3D6E" />
      <rect x="4" y="4" width="12" height="12" rx="2" fill="rgba(255,255,255,0.9)" />
      <rect x="20" y="4" width="12" height="12" rx="2" fill="rgba(255,255,255,0.6)" />
      <rect x="4" y="20" width="12" height="12" rx="2" fill="rgba(255,255,255,0.6)" />
      <rect x="20" y="20" width="12" height="12" rx="2" fill="rgba(255,255,255,0.3)" />
    </svg>
  );
}
