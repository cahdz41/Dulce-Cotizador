"use client";

import { useState, useEffect } from "react";
import { Producto } from "@/lib/types";
import { CATALOG_DATA } from "@/lib/catalog-data";
import { supabase } from "@/lib/supabase";
import Topbar from "./topbar";
import CatalogView from "./catalog/catalog-view";
import CheckoutView from "./checkout/checkout-view";
import AdminView from "./admin/admin-view";

type Mode = "cliente" | "admin";
type ClientStep = "catalog" | "checkout";

export default function MainApp() {
  const [mode, setMode] = useState<Mode>("cliente");
  const [clientStep, setClientStep] = useState<ClientStep>("catalog");
  const [products, setProducts] = useState<Producto[]>(CATALOG_DATA);

  useEffect(() => {
    supabase.from("products").select("*").then(({ data }) => {
      if (data && data.length > 0) setProducts(data);
    });
  }, [mode]);

  function handleModeChange(m: Mode) {
    setMode(m);
    if (m === "cliente") setClientStep("catalog");
  }

  return (
    <>
      <Topbar mode={mode} onModeChange={handleModeChange} />
      {mode === "cliente" ? (
        clientStep === "catalog" ? (
          <CatalogView products={products} onCheckout={() => setClientStep("checkout")} />
        ) : (
          <CheckoutView onBack={() => setClientStep("catalog")} />
        )
      ) : (
        <AdminView />
      )}
      <footer style={{
        padding: "14px 24px", background: "white", borderTop: "1px solid var(--border)",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        fontSize: 11, color: "var(--ink-soft)",
      }}>
        <span>Vidrios y Aluminio El Castillo · Cotizador en línea</span>
        <span>Pre-cotizaciones sujetas a confirmación de stock y precios</span>
      </footer>
    </>
  );
}
