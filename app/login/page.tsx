"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Lock, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    setLoading(false);

    if (!res.ok) {
      toast.error("Usuario o contraseña incorrectos.");
      return;
    }

    toast.success("Bienvenido al panel de administración.");
    router.push("/admin");
    router.refresh();
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--bg, #f6f7f9)",
        padding: 24,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 420,
          background: "white",
          borderRadius: 12,
          border: "1px solid var(--border, #e5e7eb)",
          boxShadow: "var(--shadow, 0 4px 24px rgba(0,0,0,0.06))",
          padding: "40px 32px",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              background: "var(--primary, #0F3D6E)",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 16,
            }}
          >
            <Lock size={22} color="white" />
          </div>
          <h1
            style={{
              fontSize: 20,
              fontWeight: 700,
              color: "var(--ink, #111827)",
              marginBottom: 6,
            }}
          >
            Acceso Administrador
          </h1>
          <p style={{ fontSize: 14, color: "var(--ink-soft, #6b7280)" }}>
            Ingresa tus credenciales para continuar
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div>
            <label
              style={{
                display: "block",
                fontSize: 13,
                fontWeight: 500,
                color: "var(--ink, #374151)",
                marginBottom: 6,
              }}
            >
              Usuario
            </label>
            <input
              type="text"
              required
              autoFocus
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="admin"
              style={{
                width: "100%",
                padding: "10px 14px",
                fontSize: 14,
                borderRadius: 8,
                border: "1px solid var(--border, #d1d5db)",
                outline: "none",
                background: "white",
                color: "var(--ink, #111827)",
              }}
            />
          </div>

          <div>
            <label
              style={{
                display: "block",
                fontSize: 13,
                fontWeight: 500,
                color: "var(--ink, #374151)",
                marginBottom: 6,
              }}
            >
              Contraseña
            </label>
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              style={{
                width: "100%",
                padding: "10px 14px",
                fontSize: 14,
                borderRadius: 8,
                border: "1px solid var(--border, #d1d5db)",
                outline: "none",
                background: "white",
                color: "var(--ink, #111827)",
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: 8,
              width: "100%",
              padding: "12px 16px",
              fontSize: 14,
              fontWeight: 600,
              color: "white",
              background: "var(--primary, #0F3D6E)",
              borderRadius: 8,
              border: "none",
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              transition: "opacity 0.15s",
            }}
          >
            {loading ? "Verificando..." : "Entrar al panel"}
            {!loading && <ArrowRight size={16} />}
          </button>
        </form>

        <div style={{ marginTop: 24, textAlign: "center" }}>
          <a
            href="/"
            style={{
              fontSize: 13,
              color: "var(--ink-soft, #6b7280)",
              textDecoration: "none",
            }}
          >
            ← Volver al cotizador
          </a>
        </div>
      </div>
    </div>
  );
}
