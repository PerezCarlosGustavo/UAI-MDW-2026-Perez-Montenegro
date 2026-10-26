"use client";

// Client Component porque ofrece "Reintentar": reset() vuelve a renderizar la
// página sin recargar, y para eso tiene que haber JavaScript corriendo cuando
// se aprieta el botón.
//
// Recibe cualquier error que suba de una página de (app), así ninguna tiene
// que acordarse de su propio try/catch. El detalle técnico va a la consola
// (y a los logs de Vercel); a la persona no se le muestra.

import { useEffect } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export default function ErrorDePantalla({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <Alert variant="destructive">
        <AlertTitle>No pudimos cargar esta pantalla</AlertTitle>
        <AlertDescription>
          Es un problema del sistema, no de lo que hiciste. No se perdió ningún dato.
        </AlertDescription>
      </Alert>
      <Button onClick={reset} className="mt-5">
        Reintentar
      </Button>
    </main>
  );
}
