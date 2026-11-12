import Link from "next/link";
import type { Rol } from "@prisma/client";
import SinDatos from "@/components/SinDatos";
import { Badge } from "@/components/ui/badge";
import { listarResumenesVenta } from "@/lib/db/ventas";
import { formatearFechaHora, formatearPesos } from "@/lib/utils";

export default async function VentasRecientes({ usuario }: { usuario: { id: number; rol: Rol } }) {
  try {
    const ventas = await listarResumenesVenta(usuario, 1, 3);
    if (ventas.length === 0) return <SinDatos titulo="Todavía no hay ventas" descripcion="Cuando registres la primera, va a aparecer acá." />;

    return (
      <ul className="divide-y border-y">
        {ventas.map((venta) => (
          <li key={String(venta.id)}>
            <Link href={`/ventas/${venta.id}`} className="block py-3 hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50">
              <span className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium">Venta #{String(venta.id)}</span>
                <span className="text-sm font-semibold tabular-nums">{formatearPesos(Number(venta.total))}</span>
              </span>
              <span className="mt-1 flex items-center justify-between gap-2 text-xs text-muted-foreground">
                <span className="truncate">{venta.cliente?.nombre ?? "Sin cliente"} · {formatearFechaHora(venta.fecha)}</span>
                <Badge variant={venta.tipopago === 1 ? "outline" : "secondary"}>{venta.tipopago === 1 ? "Cuenta corriente" : "Contado"}</Badge>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    );
  } catch (error) {
    console.error("VentasRecientes:", error);
    return <p role="alert" className="text-sm text-destructive">No se pudieron cargar las ventas recientes. Recargá la página para reintentar.</p>;
  }
}
