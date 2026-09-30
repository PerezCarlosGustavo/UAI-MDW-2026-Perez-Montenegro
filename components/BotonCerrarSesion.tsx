"use client";

// Client Component porque signOut corre en el navegador: borra la cookie de
// sesión y redirige. No se puede hacer desde un Server Component.

import { useState } from "react";
import { signOut } from "next-auth/react";

export default function BotonCerrarSesion() {
  const [saliendo, setSaliendo] = useState(false);

  return (
    <button
      type="button"
      onClick={() => {
        setSaliendo(true);
        void signOut({ callbackUrl: "/signin" });
      }}
      disabled={saliendo}
      className="rounded border border-slate-400 bg-white px-3 py-1 text-sm font-medium text-slate-900 hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50 dark:border-slate-500 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
    >
      {saliendo ? "Cerrando sesión..." : "Cerrar sesión"}
    </button>
  );
}
