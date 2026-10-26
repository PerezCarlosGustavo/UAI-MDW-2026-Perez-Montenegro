import Link from "next/link";
import type { Rol } from "@prisma/client";
import BotonCerrarSesion from "@/components/BotonCerrarSesion";
import EnlaceNavegacion from "@/components/EnlaceNavegacion";

// La barra contesta tres preguntas en cualquier pantalla con sesión:
// ¿dónde estoy? (el nombre del sistema lleva a la home), ¿quién soy acá?
// (nombre y rol) y ¿cómo me voy? (cerrar sesión).
//
// Esconder "Usuarios" a quien no es ADMIN es solo cortesía: la autorización
// la sigue haciendo el servidor en cada página y en cada endpoint.

const NOMBRE_ROL: Record<Rol, string> = {
  ADMIN: "Administrador",
  VENDEDOR: "Vendedor",
  PENDIENTE: "Pendiente de aprobación",
};

type Props = {
  usuario: {
    nombre: string;
    email?: string | null;
    rol: Rol;
  };
};

export default function Navegacion({ usuario }: Props) {
  const puedeOperar = usuario.rol !== "PENDIENTE";

  return (
    <header className="border-b border-slate-200 bg-white text-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/"
            className="mr-2 rounded-md text-lg font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
          >
            Almacén POS
          </Link>

          {puedeOperar ? (
            <nav aria-label="Principal" className="flex flex-wrap gap-1">
              <EnlaceNavegacion href="/ventas">Ventas</EnlaceNavegacion>
              <EnlaceNavegacion href="/clientes">Clientes</EnlaceNavegacion>
              {usuario.rol === "ADMIN" ? (
                <EnlaceNavegacion href="/usuarios">Usuarios</EnlaceNavegacion>
              ) : null}
            </nav>
          ) : null}
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right text-sm leading-tight">
            <p className="max-w-[14rem] truncate font-medium">{usuario.nombre || usuario.email}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">{NOMBRE_ROL[usuario.rol]}</p>
          </div>
          <BotonCerrarSesion />
        </div>
      </div>
    </header>
  );
}
