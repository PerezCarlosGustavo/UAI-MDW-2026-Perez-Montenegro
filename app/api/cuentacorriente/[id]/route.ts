import { responderError } from "@/lib/errores";
import { obtenerEstadoCuentaCorriente } from "@/lib/db/cuentacorriente";
import { verificarPermiso } from "@/lib/auth/verificarPermiso";
import { crearCuentaCorrienteSchema, listarCuentaCorrienteQuerySchema } from "@/lib/schemas/cuentacorriente";
import { responderJson } from "@/lib/utils";

type Contexto = { params: Promise<{ id: string }> };

export async function GET(req: Request, { params }: Contexto) {
  try {
    await verificarPermiso("cuentacorriente", "ver");

    const { id } = await params;
    const cliente = crearCuentaCorrienteSchema.safeParse({ clienteid: id });
    if (!cliente.success) return Response.json({ error: "Cliente inválido" }, { status: 400 });

    const query = listarCuentaCorrienteQuerySchema.safeParse(
      Object.fromEntries(new URL(req.url).searchParams)
    );
    if (!query.success) {
      return Response.json(
        { error: "Validación fallida", detalles: query.error.issues.map((issue) => issue.message) },
        { status: 400 }
      );
    }

    const estado = await obtenerEstadoCuentaCorriente(cliente.data.clienteid, query.data.pagina);
    if (!estado) return Response.json({ error: "Cliente no encontrado" }, { status: 404 });

    return responderJson(estado);
  } catch (error) {
    return responderError("GET /api/cuentacorriente/:clienteid", error);
  }
}