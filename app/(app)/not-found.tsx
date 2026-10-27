import Link from "next/link";
import { Button } from "@/components/ui/button";

// El texto no habla de "permiso" a propósito: "no tenés permiso para ver esta
// venta" confirmaría que existe. "No existe" y "no es tuya" se responden igual,
// como el 404 de la API (clase 6).
//
// Está adentro de (app) para que se dibuje con la barra: quien llegó por un
// link viejo sigue dentro del sistema y tiene a dónde ir.
export default function NoEncontrado() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Error 404</p>
      <h1 className="mt-1 text-3xl font-semibold">No encontramos lo que buscabas</h1>
      <p className="mt-3 text-muted-foreground">
        La dirección no corresponde a nada que puedas ver. Puede que el enlace esté mal o que ya no exista.
      </p>
      <Button asChild className="mt-6">
        <Link href="/">Volver al inicio</Link>
      </Button>
    </main>
  );
}
