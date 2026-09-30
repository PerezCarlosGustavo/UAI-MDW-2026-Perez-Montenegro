import { verificarPermiso } from "@/lib/auth/verificarPermiso";
import { obtenerVentaVisiblePara } from "@/lib/db/ventas";
import { responderJson } from "@/lib/utils";
import { responderError } from "@/lib/errores";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const usuario = await verificarPermiso("venta", "ver");

    const { id } = await params;

    // Si es de otro vendedor la consulta no la encuentra y responde 404, igual
    // que si no existiera: 403 confirmaría que esa venta existe.
    const venta = await obtenerVentaVisiblePara(BigInt(id), usuario);

    if (!venta) {
      return Response.json({ error: "Venta no encontrada" }, { status: 404 });
    }

    return responderJson(venta);
  } catch (error) {
    return responderError("GET /api/ventas/:id", error);
  }
}
