import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import CambiarRolUsuario from "@/components/CambiarRolUsuario";
import { requerirUsuario } from "@/lib/auth";
import { listarUsuarios } from "@/lib/db/usuarios";

export const dynamic = "force-dynamic";

// Server Component: lee directo de lib/db, no le pide los datos a su propia
// API (clase 8). La autorización se chequea igual que en el endpoint: el
// layout ya mandó al login a quien no tiene sesión, y acá solo entra ADMIN.
export default async function UsuariosPage() {
  const usuario = await requerirUsuario();

  // Para quien no es ADMIN, esta pantalla no existe.
  if (usuario.rol !== "ADMIN") notFound();

  const usuarios = await listarUsuarios();
  const pendientes = usuarios.filter((u) => u.rol === "PENDIENTE").length;

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Administración</p>
      <h1 className="mt-1 text-3xl font-semibold">Usuarios</h1>
      <p className="mt-2 text-muted-foreground">
        {pendientes > 0
          ? `Hay ${pendientes} ${pendientes === 1 ? "usuario esperando" : "usuarios esperando"} aprobación.`
          : "No hay usuarios esperando aprobación."}
      </p>

      <ul className="mt-6 grid gap-3">
        {usuarios.map((u) => (
          <li key={String(u.id)}>
            <Card className={u.rol === "PENDIENTE" ? "border-amber-500" : undefined}>
              <CardHeader>
                <CardTitle className="flex flex-wrap items-center gap-2">
                  <span className="min-w-0 break-words">{u.nombre || u.email}</span>
                  {u.rol === "PENDIENTE" ? <Badge variant="outline">Pendiente de aprobación</Badge> : null}
                  {!u.activo ? <Badge variant="secondary">Inactivo</Badge> : null}
                </CardTitle>
                <CardDescription className="break-all">{u.email}</CardDescription>
              </CardHeader>
              <CardContent>
                <CambiarRolUsuario
                  id={Number(u.id)}
                  rol={u.rol}
                  activo={u.activo}
                  esUnoMismo={Number(u.id) === usuario.id}
                />
              </CardContent>
            </Card>
          </li>
        ))}
      </ul>
    </main>
  );
}
