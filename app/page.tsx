import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { listarProductos } from "@/lib/productos";

export const dynamic = "force-dynamic";

export default async function Home() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/signin");
  }


  let productos: Awaited<ReturnType<typeof listarProductos>> | null = null;

  try {
    productos = await listarProductos();
  } catch {
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

      {productos === null ? (
        <section className="mt-8 rounded-lg border border-dashed p-6">
          <h2 className="text-lg font-semibold">Falta conectar la base de datos</h2>
          <p className="mt-2 text-sm opacity-80">
            El proyecto levanta, pero todavía no puede leer datos. Es lo esperable
            hasta que hagan el paso de base de datos de la clase 1:
          </p>
          <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm opacity-80">
            <li>Crear un proyecto en Supabase (o MongoDB Atlas).</li>
            <li>
              Copiar la connection string a <code>DATABASE_URL</code> en{" "}
              <code>.env.local</code>.
            </li>
            <li>
              Correr <code>npx prisma migrate dev --name init</code> y{" "}
              <code>npm run db:seed</code>.
            </li>
          </ol>
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
