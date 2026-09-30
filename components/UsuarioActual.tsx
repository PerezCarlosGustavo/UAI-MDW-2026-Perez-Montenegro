import type { Rol } from "@prisma/client";
import BotonCerrarSesion from "@/components/BotonCerrarSesion";

// Server Component: recibe el usuario ya leído de la sesión en el servidor.
// Solo el botón de cerrar sesión necesita correr en el navegador.

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

export default function UsuarioActual({ usuario }: Props) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-slate-50 px-4 py-3">
      <div className="text-sm">
        <p>
          Sesión iniciada como{" "}
          <span className="font-medium">{usuario.nombre || usuario.email}</span>
          {usuario.nombre && usuario.email ? (
            <span className="opacity-70"> ({usuario.email})</span>
          ) : null}
        </p>
        <p className="mt-1">
          Rol: <span className="font-medium">{NOMBRE_ROL[usuario.rol]}</span>
        </p>
      </div>
      <BotonCerrarSesion />
    </div>
  );
}
