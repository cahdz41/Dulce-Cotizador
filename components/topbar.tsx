"use client";

import { Store, LayoutDashboard } from "lucide-react";

type Mode = "cliente" | "admin";

type Props = {
  mode: Mode;
  onModeChange: (m: Mode) => void;
};

export default function Topbar({ mode, onModeChange }: Props) {
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

      <div style={{ display: "flex", gap: 4, padding: 4, background: "var(--bg)", borderRadius: "var(--radius)", border: "1px solid var(--border)" }}>
        <ModeButton active={mode === "cliente"} onClick={() => onModeChange("cliente")} icon={<Store size={14} />} label="Vista cliente" />
        <ModeButton active={mode === "admin"} onClick={() => onModeChange("admin")} icon={<LayoutDashboard size={14} />} label="Panel admin" />
      </div>
    </header>
  );
}

function ModeButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: 6,
        padding: "7px 14px", borderRadius: 5,
        fontSize: 13, fontWeight: 500,
        color: active ? "white" : "var(--ink-mute)",
        background: active ? "var(--primary)" : "transparent",
        boxShadow: active ? "var(--shadow-sm)" : "none",
        transition: "all 0.15s",
      }}
    >
      {icon}
      <span style={{ display: "none" }} className="md-visible">{label}</span>
      <span style={{ display: "block" }}>{label}</span>
    </button>
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
