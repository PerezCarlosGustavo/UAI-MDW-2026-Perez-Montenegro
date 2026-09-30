import Link from "next/link";
import { obtenerUsuario } from "@/lib/auth";
import { redirect } from "next/navigation";
import { listarProductos } from "@/lib/productos";

export const dynamic = "force-dynamic";

export default async function Home() {
  const usuario = await obtenerUsuario();

  if (!usuario) {
    redirect("/signin");
  }

  // Un PENDIENTE tiene sesión pero ningún permiso: no ve datos del sistema.
  if (usuario.rol === "PENDIENTE") {
    return (
      <main className="mx-auto max-w-2xl p-8">
        <h1 className="text-2xl font-bold">Cuenta pendiente de aprobación</h1>
        <p className="mt-4 text-sm opacity-80">
          Ya estás registrado como {usuario.email}. Un administrador tiene que
          asignarte un rol antes de que puedas usar el sistema.
        </p>
      </main>
    );
  }

  let productos: Awaited<ReturnType<typeof listarProductos>> | null = null;

  try {
    productos = await listarProductos();
  } catch (error) {
    console.error("Error al cargar productos desde la base de datos:", error);
    productos = null;
  }

  return (
    <main className="mx-auto max-w-2xl p-8">
      <h1 className="text-2xl font-bold">Proyecto MDW 2026</h1>
      <p className="mt-2 text-sm opacity-70">Equipo:</p>
      <ul className="mt-3 list-disc space-y-1 pl-5 text-sm opacity-80">
        <li>Carlos Gustavo Perez</li>
        <li>Leandro Jonatan Montenegro</li>
      </ul>

      <nav className="mt-6 flex gap-4 text-sm">
        <Link href="/ventas" className="underline">Ventas</Link>
        {usuario.rol === "ADMIN" ? (
          <Link href="/usuarios" className="underline">Usuarios</Link>
        ) : null}
      </nav>

      {productos === null ? (
        <section className="mt-8 rounded-lg border border-dashed p-6">
          <h2 className="text-lg font-semibold">No se pudieron cargar los productos</h2>
          <p className="mt-2 text-sm opacity-80">
            Revisá la conexión a la base de datos y el error en la terminal del servidor.
          </p>
        </section>
      ) : productos.length === 0 ? (
        <p className="mt-8 text-sm opacity-70">
          La base está conectada pero no hay datos. Corran <code>npm run db:seed</code>.
        </p>
      ) : (
        <section className="mt-8">
          <h2 className="text-lg font-semibold">Productos de ejemplo</h2>
          <ul className="mt-4 space-y-3">
            {productos.map((producto) => (
              <li key={producto.id} className="rounded-lg border p-4">
                <h3 className="font-medium">{producto.nombre}</h3>
                <p className="mt-1 text-sm opacity-80">${producto.preciolista.toFixed(2)}</p>
                <p className="mt-2 text-xs opacity-60">Stock: {producto.stockactual.toFixed(2)}</p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
