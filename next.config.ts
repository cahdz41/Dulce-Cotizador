import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  // Turbopack (Next.js 16 default para dev) — no necesita los loaders de webpack
  // porque maneja import.meta.url y ESM nativamente
  turbopack: {},
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
    ],
  },
  webpack: (config) => {
    // Excluir la versión Node de onnxruntime — solo usamos la versión WASM/web
    config.resolve.alias = {
      ...config.resolve.alias,
      "onnxruntime-node": false,
    };

    // Permitir módulos ESM (.mjs) sin errores de fullySpecified
    config.module.rules.push({
      test: /\.m?js$/,
      type: "javascript/auto",
      resolve: { fullySpecified: false },
    });

    // FIX CRÍTICO: reemplaza import.meta.url en onnxruntime-web
    // Sin esto aparece en producción: TypeError: e.replace is not a function
    config.module.rules.push({
      test: /onnxruntime-web[\\/]dist[\\/].*\.m?js$/,
      loader: "string-replace-loader",
      options: {
        search: "import.meta.url",
        replace:
          '((typeof window !== "undefined" ? window.location.href : "http://localhost/"))',
        flags: "g",
      },
    });

    return config;
  },
};

export default nextConfig;
