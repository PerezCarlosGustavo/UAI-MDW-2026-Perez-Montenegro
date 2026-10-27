import { Skeleton } from "@/components/ui/skeleton";

// Next.js envuelve las páginas de (app) en un <Suspense> con esto como
// fallback: se ve apenas se navega, antes de que la base responda.
// Es un esqueleto con la forma de una pantalla (encabezado + bloques) y no un
// spinner, para que la página no salte cuando llega el contenido.
export default function Cargando() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8" aria-busy="true" aria-label="Cargando">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="mt-3 h-8 w-64" />
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
      </div>
      <span className="sr-only">Cargando…</span>
    </main>
  );
}
