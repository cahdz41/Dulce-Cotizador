"use client";

import { useState } from "react";
import { Producto } from "@/lib/types";
import { CATALOG_DATA } from "@/lib/catalog-data";
import Topbar from "./topbar";
import CatalogView from "./catalog/catalog-view";
import CheckoutView from "./checkout/checkout-view";

type ClientStep = "catalog" | "checkout";

export default function MainApp() {
  const [clientStep, setClientStep] = useState<ClientStep>("catalog");
  const [products] = useState<Producto[]>(CATALOG_DATA);

  return (
    <>
      <Topbar />
      {clientStep === "catalog" ? (
        <CatalogView products={products} onCheckout={() => setClientStep("checkout")} />
      ) : (
        <CheckoutView onBack={() => setClientStep("catalog")} />
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
