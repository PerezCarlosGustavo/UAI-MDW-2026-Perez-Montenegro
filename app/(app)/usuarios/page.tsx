import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { obtenerUsuario } from "@/lib/auth";
import { listarUsuarios } from "@/lib/db/usuarios";
import CambiarRolUsuario from "@/components/CambiarRolUsuario";

export const dynamic = "force-dynamic";

// Server Component: lee directo de lib/db, no le pide los datos a su propia
// API (clase 8). La autorización se chequea igual que en el endpoint.
export default async function UsuariosPage() {
  const usuario = await obtenerUsuario();

  if (!usuario) redirect("/signin");

  // Para quien no es ADMIN, esta pantalla no existe.
  if (usuario.rol !== "ADMIN") notFound();

  const usuarios = await listarUsuarios();
  const pendientes = usuarios.filter((u) => u.rol === "PENDIENTE").length;

  return (
    <main className="mx-auto max-w-4xl p-8">
      <Link href="/" className="text-sm opacity-70 hover:opacity-100">
        ← Volver
      </Link>

      <h1 className="mt-4 text-2xl font-bold">Usuarios</h1>
      <p className="mt-2 text-sm opacity-80">
        {pendientes > 0
          ? `Hay ${pendientes} usuario(s) esperando aprobación.`
          : "No hay usuarios esperando aprobación."}
      </p>

      <ul className="mt-6 space-y-3">
        {usuarios.map((u) => (
          <li
            key={String(u.id)}
            className={`rounded-lg border p-4 ${u.rol === "PENDIENTE" ? "border-amber-400 bg-amber-50 text-slate-900 dark:border-amber-600 dark:bg-amber-950 dark:text-amber-50" : ""}`}
          >
            <p className="font-medium">{u.nombre || u.email}</p>
            <p className="mb-3 text-sm opacity-70">{u.email}</p>
            <CambiarRolUsuario
              id={Number(u.id)}
              rol={u.rol}
              activo={u.activo}
              esUnoMismo={Number(u.id) === usuario.id}
            />
          </li>
        ))}
      </ul>
    </main>
  );
}
