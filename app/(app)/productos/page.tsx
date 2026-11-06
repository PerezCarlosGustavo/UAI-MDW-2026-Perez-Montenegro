import Link from "next/link";
import { notFound } from "next/navigation";
import CambiarEstadoProducto from "@/components/CambiarEstadoProducto";
import SinDatos from "@/components/SinDatos";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { requerirUsuario } from "@/lib/auth";
import { PERMISOS } from "@/lib/auth/permisos";
import { listarCatalogo } from "@/lib/db/productos";
import { listarProductosQuerySchema } from "@/lib/schemas/producto";
import { formatearPesos } from "@/lib/utils";
import { cambiarEstadoProductoAction } from "./acciones";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ q?: string; pagina?: string }> };

// La búsqueda vive en la URL: un <form> común que recarga la página en el
// servidor, sin estado de cliente y con un enlace que se puede compartir.
export default async function ProductosPage({ searchParams }: Props) {
  const usuario = await requerirUsuario();

  if (!PERMISOS.producto.ver.includes(usuario.rol)) notFound();

  // Esconder los botones al vendedor es cortesía: lo que lo impide es la
  // verificación adentro de cada acción.
  const administra = PERMISOS.producto.editar.includes(usuario.rol);

  const { q, pagina } = listarProductosQuerySchema.parse(await searchParams);
  const { productos, total, totalPaginas } = await listarCatalogo({ q, pagina, incluirBajas: administra });

  const enlacePagina = (destino: number) => {
    const parametros = new URLSearchParams({ pagina: String(destino) });
    if (q) parametros.set("q", q);
    return `/productos?${parametros}`;
  };

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Catálogo</p>
          <h1 className="mt-1 text-3xl font-semibold">Productos</h1>
          <p className="mt-2 text-muted-foreground">
            {total} {total === 1 ? "producto" : "productos"}
          </p>
        </div>
        {administra ? (
          <Button asChild>
            <Link href="/productos/nuevo">Nuevo producto</Link>
          </Button>
        ) : null}
      </div>

      <form role="search" action="/productos" className="mt-6 flex max-w-xl gap-2">
        <label htmlFor="buscar-producto" className="sr-only">
          Buscar por nombre o código de barras
        </label>
        <Input id="buscar-producto" type="search" name="q" defaultValue={q} placeholder="Nombre o código de barras" />
        <Button type="submit" variant="outline">
          Buscar
        </Button>
      </form>

      {productos.length === 0 ? (
        <SinDatos
          className="mt-6"
          titulo={q ? `No hay productos que coincidan con “${q}”` : "Todavía no hay productos"}
          descripcion={q ? "Probá con otro nombre o con el código de barras." : undefined}
          accion={
            !q && administra ? (
              <Button asChild>
                <Link href="/productos/nuevo">Cargar el primero</Link>
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[42rem] text-left text-sm">
            <thead className="border-b text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th scope="col" className="py-2 pr-3 font-medium">Producto</th>
                <th scope="col" className="px-3 py-2 font-medium">Categoría</th>
                <th scope="col" className="px-3 py-2 text-right font-medium">Precio</th>
                <th scope="col" className="px-3 py-2 text-right font-medium">Stock</th>
                {administra ? <th scope="col" className="py-2 pl-3 text-right font-medium">Acciones</th> : null}
              </tr>
            </thead>
            <tbody className="divide-y">
              {productos.map((producto) => {
                const stock = Number(producto.stockactual);
                const stockBajo = producto.permitestock && producto.stockminimo !== null && stock < Number(producto.stockminimo);

                return (
                  <tr key={String(producto.id)} className={stockBajo ? "bg-amber-50 dark:bg-amber-950/30" : undefined}>
                    <td className="py-3 pr-3">
                      <span className="block font-medium">{producto.nombre}</span>
                      <span className="text-xs text-muted-foreground">{producto.codigobarra ?? "Sin código"}</span>
                      {!producto.activo ? <Badge variant="secondary" className="ml-2">De baja</Badge> : null}
                    </td>
                    <td className="px-3 py-3 text-muted-foreground">{producto.categoria.nombre}</td>
                    <td className="px-3 py-3 text-right tabular-nums">{formatearPesos(Number(producto.preciolista))}</td>
                    <td className="px-3 py-3 text-right tabular-nums">
                      {producto.permitestock ? stock : <span className="text-muted-foreground">No controla</span>}
                      {producto.permitestock ? (
                        <span className="ml-2 text-xs text-muted-foreground">Mínimo: {producto.stockminimo === null ? "Sin definir" : Number(producto.stockminimo)}</span>
                      ) : null}
                      {stockBajo ? <Badge variant="destructive" className="ml-2">Stock bajo</Badge> : null}
                      {/* Stock negativo: la venta se hizo igual y queda pendiente
                          el ajuste del administrador (ADR 0004). */}
                      {producto.permitestock && stock < 0 ? (
                        <Badge variant="destructive" className="ml-2">Ajustar</Badge>
                      ) : null}
                    </td>
                    {administra ? (
                      <td className="py-3 pl-3">
                        <div className="flex justify-end gap-2">
                          <Button asChild variant="outline" size="sm">
                            <Link href={`/productos/${producto.id}/editar`} aria-label={`Editar ${producto.nombre}`}>
                              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m16 3 5 5M4 20l4-1L21 6a2 2 0 0 0-5-5L3 14l-1 7Z" /></svg> Editar
                            </Link>
                          </Button>
                          <CambiarEstadoProducto
                            accion={cambiarEstadoProductoAction.bind(null, Number(producto.id), !producto.activo)}
                            activo={producto.activo}
                            nombre={producto.nombre}
                          />
                        </div>
                      </td>
                    ) : null}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {totalPaginas > 1 ? (
        <nav aria-label="Páginas" className="mt-4 flex items-center justify-end gap-3">
          <span className="text-sm text-muted-foreground">Página {pagina} de {totalPaginas}</span>
          {pagina > 1 ? (
            <Button asChild variant="outline" size="sm">
              <Link href={enlacePagina(pagina - 1)}>Anterior</Link>
            </Button>
          ) : null}
          {pagina < totalPaginas ? (
            <Button asChild variant="outline" size="sm">
              <Link href={enlacePagina(pagina + 1)}>Siguiente</Link>
            </Button>
          ) : null}
        </nav>
      ) : null}
    </main>
  );
}
