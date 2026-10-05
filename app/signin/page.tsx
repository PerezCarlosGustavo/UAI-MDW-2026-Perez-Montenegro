"use client";

// Client Component porque signIn corre en el navegador (redirige a Google).

import { useState } from "react";
import { signIn } from "next-auth/react";

export default function SignInPage() {
  const [redirigiendo, setRedirigiendo] = useState(false);

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm rounded-lg border border-slate-200 bg-white p-8 text-slate-900 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-400">
          Punto de venta
        </p>
        <h1 className="mt-1 text-2xl font-semibold">Almacén POS</h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          Ventas, stock y cuentas corrientes del almacén. Ingresá con tu cuenta de Google.
        </p>

        <button
          type="button"
          onClick={() => {
            setRedirigiendo(true);
            void signIn("google", { callbackUrl: "/" });
          }}
          disabled={redirigiendo}
          className="mt-8 flex w-full items-center justify-center gap-3 rounded-md border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-900 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
        >
          <svg aria-hidden="true" viewBox="0 0 48 48" className="h-5 w-5">
            <path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 8 3l5.7-5.7C34 6.1 29.3 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.3-.1-2.6-.4-3.9z" />
            <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 8 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
            <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2c-2 1.5-4.5 2.4-7.2 2.4-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" />
            <path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.6-.4-3.9z" />
          </svg>
          {redirigiendo ? "Redirigiendo a Google…" : "Ingresar con Google"}
        </button>

        <p className="mt-6 text-xs text-slate-500 dark:text-slate-400">
          Si es tu primera vez, tu cuenta queda pendiente hasta que un administrador te asigne un rol.
        </p>
      </div>
    </main>
  );
}
