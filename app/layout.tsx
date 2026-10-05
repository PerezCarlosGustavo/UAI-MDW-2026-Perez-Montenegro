import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Almacén POS",
  description: "Punto de venta, stock y cuentas corrientes para comercios de barrio — MDW 2026, UAI",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
