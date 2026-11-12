import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import VentasRecientes from "@/components/VentasRecientes";
import { Button } from "@/components/ui/button";
import FormularioVenta from "@/components/FormularioVenta";
import SinDatos from "@/components/SinDatos";
import { requerirUsuario } from "@/lib/auth";
import { PERMISOS } from "@/lib/auth/permisos";
import { hayProductosParaVender } from "@/lib/db/productos";

export const dynamic = "force-dynamic";

// Server Component: lee directo de lib/db, sin pedirle los datos a su propia
// API (clase 8). La única parte de cliente es el formulario.
export default async function NuevaVentaPage() {
  const usuario = await requerirUsuario();

  // Mismo criterio que la API: si el rol no puede ver ventas, la pantalla no
  // existe para él (PENDIENTE).
  if (!PERMISOS.venta.ver.includes(usuario.rol) || !PERMISOS.venta.crear.includes(usuario.rol)) notFound();

  const hayProductos = await hayProductosParaVender();

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Punto de venta</p>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
        <h1 className="mt-1 text-3xl font-semibold">Nueva venta</h1>
        <Button asChild variant="outline"><Link href="/ventas">Ver todas las ventas</Link></Button>
      </div>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1.6fr)_minmax(17rem,0.8fr)]">
        {!hayProductos ? (
          <SinDatos
            titulo="Todavía no hay productos para vender"
            descripcion="Un administrador tiene que cargar el catálogo antes de registrar ventas."
            accion={
              PERMISOS.producto.crear.includes(usuario.rol) ? (
                <Button asChild>
                  <Link href="/productos/nuevo">Cargar un producto</Link>
                </Button>
              ) : undefined
            }
          />
        ) : (
          <FormularioVenta />
        )}

        <aside aria-labelledby="ventas-recientes" className="min-w-0 lg:border-l lg:pl-8">
          <h2 id="ventas-recientes" className="mb-4 text-lg font-semibold">
            {usuario.rol === "ADMIN" ? "Ventas recientes" : "Tus ventas recientes"}
          </h2>

          <Suspense fallback={<p role="status" className="text-sm text-muted-foreground">Cargando ventas recientes…</p>}>
            <VentasRecientes usuario={usuario} />
          </Suspense>
        </aside>
      </div>
    </main>
  );
}
