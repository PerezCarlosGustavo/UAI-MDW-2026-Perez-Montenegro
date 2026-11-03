import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requerirUsuario } from "@/lib/auth";
import { PERMISOS } from "@/lib/auth/permisos";
import { obtenerVentaVisiblePara } from "@/lib/db/ventas";
import { formatearFechaHora, formatearPesos } from "@/lib/utils";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

// Detalle de una venta. Mismo criterio que GET /api/ventas/:id: la consulta
// lleva el id de la sesión, así que la venta de otro vendedor da notFound()
// igual que una que no existe (no se confirma que exista).
export default async function DetalleVenta({ params }: Props) {
  const usuario = await requerirUsuario();
  if (!PERMISOS.venta.ver.includes(usuario.rol)) notFound();

  const { id } = await params;
  // Un id que no es número no puede ser una venta: 404, no un error.
  if (!/^\d+$/.test(id)) notFound();

  const venta = await obtenerVentaVisiblePara(BigInt(id), usuario);
  if (!venta) notFound();

  const esCuentaCorriente = venta.tipopago === 1;

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <Link href="/ventas" className="text-sm text-muted-foreground hover:text-primary">
        ← Ventas
      </Link>

      <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Detalle</p>
          <h1 className="mt-1 text-3xl font-semibold">Venta #{String(venta.id)}</h1>
        </div>
        <Badge variant={esCuentaCorriente ? "outline" : "secondary"}>
          {esCuentaCorriente ? "Cuenta corriente" : "Contado"}
        </Badge>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-2xl tabular-nums">{formatearPesos(Number(venta.total))}</CardTitle>
          <CardDescription>
            {formatearFechaHora(venta.fecha)} · Registró {venta.usuario.nombre || "—"} ·{" "}
            {venta.cliente ? (
              <>Cliente: {venta.cliente.nombre}</>
            ) : (
              "Sin cliente"
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[28rem] text-left text-sm">
              <caption className="sr-only">Productos de la venta</caption>
              <thead className="border-b text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th scope="col" className="py-2 pr-3 font-medium">Producto</th>
                  <th scope="col" className="px-3 py-2 text-right font-medium">Cant.</th>
                  <th scope="col" className="px-3 py-2 text-right font-medium">Precio</th>
                  <th scope="col" className="py-2 pl-3 text-right font-medium">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {venta.detalleventa.map((linea, indice) => (
                  <tr key={indice}>
                    <td className="py-3 pr-3 font-medium">{linea.producto.nombre}</td>
                    <td className="px-3 py-3 text-right tabular-nums">{Number(linea.cantidad)}</td>
                    <td className="px-3 py-3 text-right tabular-nums">{formatearPesos(Number(linea.preciounitario))}</td>
                    <td className="py-3 pl-3 text-right font-medium tabular-nums">{formatearPesos(Number(linea.subtotal))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            El precio es el del catálogo al momento de la venta: queda congelado aunque después cambie.
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
