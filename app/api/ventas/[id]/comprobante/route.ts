import { verificarPermiso } from "@/lib/auth/verificarPermiso";
import { obtenerVentaVisiblePara } from "@/lib/db/ventas";
import { responderError } from "@/lib/errores";
import { comprobanteParamsSchema } from "@/lib/schemas/comprobante";
import { renderizarTicketVenta } from "@/lib/tickets/generarTicketVenta";
import { responderPdf } from "@/lib/utils";

// GET /api/ventas/:id/comprobante → el ticket en PDF para imprimir.
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const usuario = await verificarPermiso("venta", "ver");

    const parametros = comprobanteParamsSchema.safeParse(await params);
    if (!parametros.success) return Response.json({ error: "Solicitud inválida" }, { status: 400 });

    // Misma consulta que el detalle: el comprobante de la venta de otro vendedor
    // responde 404, igual que si no existiera.
    const venta = await obtenerVentaVisiblePara(BigInt(parametros.data.id), usuario);
    if (!venta) return Response.json({ error: "Venta no encontrada" }, { status: 404 });

    const pdf = await renderizarTicketVenta({
      ventaId: venta.id,
      fecha: venta.fecha,
      total: Number(venta.total),
      productos: venta.detalleventa.map((linea) => ({
        nombre: linea.producto.nombre,
        cantidad: Number(linea.cantidad),
        subtotal: Number(linea.subtotal),
      })),
    });

    return responderPdf(pdf, `ticket-venta-${parametros.data.id}.pdf`);
  } catch (error) {
    return responderError("GET /api/ventas/:id/comprobante", error);
  }
}
