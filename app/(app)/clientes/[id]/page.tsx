import Link from "next/link";
import { notFound } from "next/navigation";
import FormularioCobro from "@/components/FormularioCobro";
import SinDatos from "@/components/SinDatos";
import { Button } from "@/components/ui/button";
import { verificarPermiso } from "@/lib/auth/verificarPermiso";
import { obtenerCliente } from "@/lib/db/clientes";
import { obtenerEstadoCuentaCorriente } from "@/lib/db/cuentacorriente";
import { crearCuentaCorrienteSchema, listarCuentaCorrienteQuerySchema } from "@/lib/schemas/cuentacorriente";
import { formatearPesos } from "@/lib/utils";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ pagina?: string }>;
};

export default async function ClientePage({ params, searchParams }: Props) {
  await verificarPermiso("cuentacorriente", "ver");
  const identificador = crearCuentaCorrienteSchema.safeParse({ clienteid: (await params).id });
  const consulta = listarCuentaCorrienteQuerySchema.safeParse(await searchParams);
  if (!identificador.success || !consulta.success) notFound();
  const clienteid = identificador.data.clienteid;
  const cliente = await obtenerCliente(BigInt(clienteid));
  if (!cliente) notFound();
  const estado = await obtenerEstadoCuentaCorriente(clienteid, consulta.data.pagina);
  if (!estado) notFound();

  return (
    <main className="mx-auto max-w-5xl space-y-6 px-4 py-8">
      <Button asChild variant="outline"><Link href="/clientes">Volver a clientes</Link></Button>
      <header>
        <p className="text-sm text-muted-foreground">Cuenta corriente</p>
        <h1 className="text-3xl font-semibold">{cliente.nombre}</h1>
      </header>
      <dl className="grid gap-4 rounded-md border p-4 sm:grid-cols-3">
        <div><dt>Deuda actual</dt><dd className="text-xl font-semibold">{formatearPesos(estado.totalDeuda)}</dd></div>
        <div><dt>Saldo a favor</dt><dd className="text-xl font-semibold">{formatearPesos(estado.saldoAFavor)}</dd></div>
        <div><dt>Productos pendientes</dt><dd>{estado.totalPendientes}</dd></div>
      </dl>
      {estado.pendientes.length === 0 ? (
        <SinDatos titulo="No hay productos pendientes" descripcion="Este cliente no tiene deuda pendiente en esta página." />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <caption className="mb-3 text-left font-semibold">Deuda pendiente — FIFO</caption>
            <thead className="border-b"><tr><th className="p-2">Producto</th><th className="p-2">Fecha</th><th className="p-2">Cantidad</th><th className="p-2">Precio actual</th><th className="p-2">Subtotal</th></tr></thead>
            <tbody>
              {estado.pendientes.map((item) => (
                <tr key={item.movimientoid} className="border-b">
                  <td className="p-2">{item.nombre}</td>
                  <td className="p-2">{new Intl.DateTimeFormat("es-AR", { dateStyle: "medium" }).format(item.fecha)}</td>
                  <td className="p-2">{item.cantidad}</td>
                  <td className="p-2">{formatearPesos(item.precioUnitario)}</td>
                  <td className="p-2">{formatearPesos(item.subtotalActual)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {estado.totalPaginas > 1 ? (
        <nav aria-label="Paginación de deuda" className="flex items-center justify-end gap-3">
          {estado.pagina > 1 ? <Button asChild variant="outline"><Link href={"?pagina=" + (estado.pagina - 1)}>Anterior</Link></Button> : null}
          <span>Página {estado.pagina} de {estado.totalPaginas}</span>
          {estado.pagina < estado.totalPaginas ? <Button asChild variant="outline"><Link href={"?pagina=" + (estado.pagina + 1)}>Siguiente</Link></Button> : null}
        </nav>
      ) : null}
      <FormularioCobro clienteid={clienteid} />
    </main>
  );
}
