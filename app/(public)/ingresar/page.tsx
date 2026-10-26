import { redirect } from "next/navigation";
import { obtenerUsuario } from "@/lib/auth";
import BotonIngresarGoogle from "@/components/BotonIngresarGoogle";

export const dynamic = "force-dynamic";

// Si el login falla, NextAuth vuelve acá con ?error=<código>. Se muestra un
// mensaje para la persona, nunca el detalle técnico (que queda en los logs).
function mensajeDeError(codigo: string) {
  if (codigo === "AccessDenied") return "No se pudo validar tu cuenta. Probá de nuevo.";
  if (codigo === "OAuthSignin" || codigo === "OAuthCallback") {
    return "Google no respondió como esperábamos. Probá de nuevo en unos minutos.";
  }
  return "No pudimos iniciar tu sesión. Probá de nuevo; si sigue pasando, avisale al administrador.";
}

type Props = { searchParams: Promise<{ error?: string }> };

export default async function Ingresar({ searchParams }: Props) {
  // Quien ya tiene sesión no tiene nada que hacer acá.
  if (await obtenerUsuario()) redirect("/");

  const { error } = await searchParams;

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

        {error ? (
          <p role="alert" className="mt-6 border-l-4 border-rose-600 bg-rose-50 px-3 py-2 text-sm text-rose-900 dark:bg-rose-950/40 dark:text-rose-100">
            {mensajeDeError(error)}
          </p>
        ) : null}

        <div className="mt-8">
          <BotonIngresarGoogle />
        </div>

        <p className="mt-6 text-xs text-slate-500 dark:text-slate-400">
          Si es tu primera vez, tu cuenta queda pendiente hasta que un administrador te asigne un rol.
        </p>
      </div>
    </main>
  );
}
