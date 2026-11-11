"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { obtenerComprobantePdf } from "@/lib/descargarComprobante";

type Props = { url: string; nombre: string; className?: string };

export default function DescargarComprobante({ url, nombre, className }: Props) {
  const [descargando, setDescargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function descargar() {
    setError(null);
    setDescargando(true);
    try {
      const pdf = await obtenerComprobantePdf(url);
      const direccion = URL.createObjectURL(pdf);
      const enlace = document.createElement("a");
      enlace.href = direccion;
      enlace.download = nombre;
      document.body.appendChild(enlace);
      enlace.click();
      enlace.remove();
      setTimeout(() => URL.revokeObjectURL(direccion), 60_000);
    } catch (fallo) {
      setError(fallo instanceof Error ? fallo.message : "No se pudo descargar el comprobante.");
    } finally {
      setDescargando(false);
    }
  }

  return (
    <span className={className}>
      <Button type="button" variant="outline" disabled={descargando} onClick={() => void descargar()}>
        {descargando ? "Descargando..." : "Descargar comprobante"}
      </Button>
      {error ? <span role="alert" className="ml-2 text-sm text-destructive">{error}</span> : null}
    </span>
  );
}
