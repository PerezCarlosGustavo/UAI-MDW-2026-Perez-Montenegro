import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import FormularioVenta from "@/components/FormularioVenta";
import SinDatos from "@/components/SinDatos";
import { requerirUsuario } from "@/lib/auth";
import { PERMISOS } from "@/lib/auth/permisos";
import { listarClientes } from "@/lib/db/clientes";
import { listarProductosActivos } from "@/lib/db/productos";
import { listarVentasVisiblesPara } from "@/lib/db/ventas";
import { formatearFechaHora, formatearPesos } from "@/lib/utils";

export const dynamic = "force-dynamic";

// Server Component: lee directo de lib/db, sin pedirle los datos a su propia
// API (clase 8). La única parte de cliente es el formulario.
export default async function VentasPage() {
  const usuario = await requerirUsuario();

  // Mismo criterio que la API: si el rol no puede ver ventas, la pantalla no
  // existe para él (PENDIENTE).
  if (!PERMISOS.venta.ver.includes(usuario.rol)) notFound();

  // Las tres consultas no dependen entre sí: en paralelo, no en serie.
  const [productos, clientes, ventas] = await Promise.all([
    listarProductosActivos(),
    listarClientes(),
    // El id de la sesión va adentro de la consulta: un VENDEDOR ve solo las
    // suyas, un ADMIN todas.
    listarVentasVisiblesPara(usuario),
  ]);

  // A un Client Component solo se le pasan datos planos: los Decimal y BigInt
  // de Prisma se convierten acá.
  const catalogo = productos.map((p) => ({ id: Number(p.id), nombre: p.nombre, preciolista: Number(p.preciolista) }));
  const seleccionables = clientes.map((c) => ({ id: Number(c.id), nombre: c.nombre }));
  const recientes = ventas.slice(0, 10);

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Punto de venta</p>
      <h1 className="mt-1 mb-8 text-3xl font-semibold">Ventas</h1>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1.6fr)_minmax(17rem,0.8fr)]">
        {catalogo.length === 0 ? (
          <SinDatos
            titulo="Todavía no hay productos para vender"
            descripcion="Un administrador tiene que cargar el catálogo antes de registrar ventas."
          />
        ) : (
          <FormularioVenta productos={catalogo} clientes={seleccionables} />
        )}

        <aside aria-labelledby="ventas-recientes" className="min-w-0 lg:border-l lg:pl-8">
          <h2 id="ventas-recientes" className="mb-4 text-lg font-semibold">
            {usuario.rol === "ADMIN" ? "Ventas recientes" : "Tus ventas recientes"}
          </h2>

          {recientes.length === 0 ? (
            <SinDatos
              titulo="Todavía no hay ventas"
              descripcion="Cuando registres la primera, va a aparecer acá."
            />
          ) : (
            <ul className="divide-y border-y">
              {recientes.map((venta) => (
                <li key={String(venta.id)}>
                  <Link
                    href={`/ventas/${venta.id}`}
                    className="block py-3 hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                  >
                    <span className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium">Venta #{String(venta.id)}</span>
                      <span className="text-sm font-semibold tabular-nums">{formatearPesos(Number(venta.total))}</span>
                    </span>
                    <span className="mt-1 flex items-center justify-between gap-2 text-xs text-muted-foreground">
                      <span className="truncate">
                        {venta.cliente?.nombre ?? "Sin cliente"} · {formatearFechaHora(venta.fecha)}
                      </span>
                      <Badge variant={venta.tipopago === 1 ? "outline" : "secondary"}>
                        {venta.tipopago === 1 ? "Cuenta corriente" : "Contado"}
                      </Badge>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </aside>
      </div>
    </main>
  );
}
