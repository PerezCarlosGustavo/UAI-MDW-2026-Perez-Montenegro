import Link from "next/link";

// El texto no habla de "permiso" a propósito: "no tenés permiso para ver esta
// venta" confirmaría que existe. "No existe" y "no es tuya" se responden igual,
// como el 404 de la API (clase 6).
//
// Está adentro de (app) para que se dibuje con la barra: quien llegó por un
// link viejo sigue dentro del sistema y tiene a dónde ir.
export default function NoEncontrado() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
        Error 404
      </p>
      <h1 className="mt-1 text-3xl font-semibold text-slate-950 dark:text-white">No encontramos lo que buscabas</h1>
      <p className="mt-3 text-slate-600 dark:text-slate-400">
        La dirección no corresponde a nada que puedas ver. Puede que el enlace esté mal o que ya no exista.
      </p>
      <Link
        href="/"
        className="mt-6 inline-block rounded-md bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 dark:bg-emerald-600 dark:hover:bg-emerald-500"
      >
        Volver al inicio
      </Link>
    </main>
  );
}
