"use client";

// Client Component porque ofrece "Reintentar": reset() vuelve a renderizar la
// página sin recargar, y para eso tiene que haber JavaScript corriendo cuando
// se aprieta el botón.
//
// Recibe cualquier error que suba de una página de (app), así ninguna tiene
// que acordarse de su propio try/catch. El detalle técnico va a la consola
// (y a los logs de Vercel); a la persona no se le muestra.

import { useEffect } from "react";

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
      <div role="alert" className="border-l-4 border-rose-600 bg-rose-50 px-5 py-4 text-rose-950 dark:bg-rose-950/40 dark:text-rose-100">
        <h1 className="text-lg font-semibold">No pudimos cargar esta pantalla</h1>
        <p className="mt-1 text-sm">
          Es un problema del sistema, no de lo que hiciste. No se perdió ningún dato.
        </p>
      </div>
      <button
        type="button"
        onClick={reset}
        className="mt-5 rounded-md bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 dark:bg-emerald-600 dark:hover:bg-emerald-500"
      >
        Reintentar
      </button>
    </main>
  );
}
