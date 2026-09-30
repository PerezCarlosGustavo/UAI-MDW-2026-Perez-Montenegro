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
      className="rounded border border-slate-300 px-3 py-1 text-sm hover:bg-slate-100 disabled:opacity-50"
    >
      {saliendo ? "Cerrando sesión..." : "Cerrar sesión"}
    </button>
  );
}
