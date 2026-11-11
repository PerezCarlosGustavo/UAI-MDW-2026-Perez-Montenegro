import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Las pruebas e2e compilan aparte para no pisar el `.next` de un `npm run dev`
  // que esté corriendo (playwright.config.ts).
  distDir: process.env.NEXT_DIST_DIR || ".next",

  // PDFKit carga estas fuentes dinámicamente y Next no las detecta al trazar
  // dependencias. Se necesitan en endpoints y Server Actions que generan PDF.
  outputFileTracingIncludes: {
    "/*": ["./node_modules/pdfkit/js/standard-fonts/**/*"],
  },

  // El build falla si hay errores de tipos o de lint. Es a propósito:
  // preferimos enterarnos en el Pull Request y no en producción.
  typescript: { ignoreBuildErrors: false },
  eslint: { ignoreDuringBuilds: false },

  // El login se mudó de /signin a /ingresar: los links viejos siguen andando.
  async redirects() {
    return [{ source: "/signin", destination: "/ingresar", permanent: false }];
  },
};

export default nextConfig;
