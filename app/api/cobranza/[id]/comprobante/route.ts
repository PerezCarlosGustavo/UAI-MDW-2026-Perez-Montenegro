import { verificarPermiso } from "@/lib/auth/verificarPermiso";
import { obtenerComprobanteCobro } from "@/lib/db/cuentacorriente";
import { responderError } from "@/lib/errores";
import { comprobanteParamsSchema } from "@/lib/schemas/comprobante";
import { renderizarTicketCobro } from "@/lib/tickets/generarTicketCobro";
import { responderPdf } from "@/lib/utils";

// GET /api/cobranza/:id/comprobante → el comprobante de liquidación en PDF.
// El permiso es el de ver cuentas corrientes: quien ve la cuenta ve sus cobros.
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await verificarPermiso("cuentacorriente", "ver");

    const parametros = comprobanteParamsSchema.safeParse(await params);
    if (!parametros.success) return Response.json({ error: "Solicitud inválida" }, { status: 400 });

    const comprobante = await obtenerComprobanteCobro(parametros.data.id);
    if (!comprobante) return Response.json({ error: "Cobro no encontrado" }, { status: 404 });

    return responderPdf(await renderizarTicketCobro(comprobante), `comprobante-cobro-${parametros.data.id}.pdf`);
  } catch (error) {
    return responderError("GET /api/cobranza/:id/comprobante", error);
  }
}
