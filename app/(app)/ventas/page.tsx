import Link from "next/link";
import { notFound } from "next/navigation";
import SinDatos from "@/components/SinDatos";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { requerirUsuario } from "@/lib/auth";
import { PERMISOS } from "@/lib/auth/permisos";
import { contarVentasVisiblesPara, listarResumenesVenta } from "@/lib/db/ventas";
import { listarVentasQuerySchema } from "@/lib/schemas/venta";
import { formatearFechaHora, formatearPesos } from "@/lib/utils";

export const dynamic = "force-dynamic";

const VENTAS_POR_PAGINA = 10;
type Props = { searchParams: Promise<{ pagina?: string }> };

export default async function VentasPage({ searchParams }: Props) {
  const usuario = await requerirUsuario();
  if (!PERMISOS.venta.ver.includes(usuario.rol)) notFound();
  const resultado = listarVentasQuerySchema.safeParse(await searchParams);
  // Prisma usa un entero de 32 bits para el desplazamiento.
  const pagina = resultado.success && resultado.data.pagina <= 214748365 ? resultado.data.pagina : 1;
  const [ventas, total] = await Promise.all([
    listarResumenesVenta(usuario, pagina, VENTAS_POR_PAGINA),
    contarVentasVisiblesPara(usuario),
  ]);
  const totalPaginas = Math.ceil(total / VENTAS_POR_PAGINA);

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Punto de venta</p>
          <h1 className="mt-1 text-3xl font-semibold">Ventas</h1>
          <p className="mt-2 text-muted-foreground">{usuario.rol === "ADMIN" ? "Todas las ventas" : "Tus ventas"}</p>
        </div>
        {PERMISOS.venta.crear.includes(usuario.rol) ? <Button asChild><Link href="/ventas/nueva">Nueva venta</Link></Button> : null}
      </div>
      {ventas.length === 0 ? (
        <SinDatos className="mt-6" titulo={pagina === 1 ? "Todavía no hay ventas" : "No hay ventas en esta página"} />
      ) : (
        <ul className="mt-6 divide-y border-y" aria-label="Listado de ventas">
          {ventas.map((venta) => (
            <li key={String(venta.id)}>
              <Link href={`/ventas/${venta.id}`} className="block py-3 hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50">
                <span className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium">Venta #{String(venta.id)}</span>
                  <span className="text-sm font-semibold tabular-nums">{formatearPesos(Number(venta.total))}</span>
                </span>
                <span className="mt-1 flex items-center justify-between gap-2 text-xs text-muted-foreground">
                  <span>{venta.cliente?.nombre ?? "Sin cliente"} · {formatearFechaHora(venta.fecha)}</span>
                  <Badge variant={venta.tipopago === 1 ? "outline" : "secondary"}>{venta.tipopago === 1 ? "Cuenta corriente" : "Contado"}</Badge>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      {totalPaginas > 1 || pagina > 1 ? (
        <nav aria-label="Páginas" className="mt-4 flex items-center justify-end gap-3">
          <span className="text-sm text-muted-foreground">Página {pagina} de {totalPaginas || 1}</span>
          {pagina > 1 ? <Button asChild variant="outline" size="sm"><Link href={`/ventas?pagina=${pagina - 1}`}>Anterior</Link></Button> : null}
          {pagina < totalPaginas ? <Button asChild variant="outline" size="sm"><Link href={`/ventas?pagina=${pagina + 1}`}>Siguiente</Link></Button> : null}
        </nav>
      ) : null}
    </main>
  );
}
