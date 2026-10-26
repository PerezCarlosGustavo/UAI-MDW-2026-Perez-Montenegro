import Link from "next/link";
import { requerirUsuario } from "@/lib/auth";

export const dynamic = "force-dynamic";

// requerirUsuario y no obtenerUsuario: el layout de (app) ya mandó al login a
// quien no tiene sesión, así que llegar acá sin usuario es un error, y lo
// recibe error.tsx.
export default async function Inicio() {
  const usuario = await requerirUsuario();

  // Un PENDIENTE tiene sesión pero ningún permiso: no ve datos del sistema.
  if (usuario.rol === "PENDIENTE") {
    return (
      <main className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700 dark:text-amber-400">
          Cuenta pendiente
        </p>
        <h1 className="mt-1 text-3xl font-semibold text-slate-950 dark:text-white">Esperando aprobación</h1>
        <p className="mt-3 text-slate-600 dark:text-slate-400">
          Ya estás registrado. Un administrador tiene que asignarte un rol antes de que puedas
          usar el sistema.
        </p>
      </main>
    );
  }

  const accesos = [
    {
      href: "/ventas",
      titulo: "Registrar una venta",
      descripcion: "Contado o cuenta corriente. El precio sale del catálogo.",
    },
    {
      href: "/clientes",
      titulo: "Cuentas corrientes",
      descripcion: "Consultar la deuda de un cliente y registrar un cobro.",
    },
    ...(usuario.rol === "ADMIN"
      ? [
          {
            href: "/usuarios",
            titulo: "Usuarios",
            descripcion: "Aprobar cuentas nuevas y asignar roles.",
          },
        ]
      : []),
  ];

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-400">
        Inicio
      </p>
      <h1 className="mt-1 text-3xl font-semibold text-slate-950 dark:text-white">
        Hola, {usuario.nombre || usuario.email}
      </h1>
      <p className="mt-2 text-slate-600 dark:text-slate-400">¿Qué querés hacer?</p>

      <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {accesos.map((acceso) => (
          <li key={acceso.href}>
            <Link
              href={acceso.href}
              className="block h-full rounded-lg border border-slate-200 bg-white p-5 text-slate-900 hover:border-emerald-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-emerald-500"
            >
              <span className="block font-semibold">{acceso.titulo}</span>
              <span className="mt-1 block text-sm text-slate-600 dark:text-slate-400">{acceso.descripcion}</span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
