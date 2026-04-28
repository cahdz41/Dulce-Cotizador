import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { CartProvider } from "@/lib/cart-context";
import { EmpresaProvider } from "@/lib/empresa-context";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: "500",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Cotizador · Vidrios y Aluminio El Castillo",
  description: "Cotizador en línea de vidrios y perfiles de aluminio",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className={`${inter.variable} ${jetbrainsMono.variable}`}>
        <EmpresaProvider>
          <CartProvider>
            <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
              {children}
            </div>
            <Toaster position="bottom-center" richColors />
          </CartProvider>
        </EmpresaProvider>
      </body>
    </html>
  );
}
