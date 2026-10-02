import { responderError } from "@/lib/errores";
import { registrarCobranza } from "@/lib/db/cuentacorriente";
import { verificarPermiso } from "@/lib/auth/verificarPermiso";
import { crearCobranzaSchema } from "@/lib/schemas/cuentacorriente";
import { responderJson } from "@/lib/utils";

export async function POST(req: Request) {
  try {
    await verificarPermiso("cuentacorriente", "cobrar");

    const resultado = crearCobranzaSchema.safeParse(await req.json());
    if (!resultado.success) {
      return Response.json(
        { error: "Validación fallida", detalles: resultado.error.issues.map((issue) => issue.message) },
        { status: 400 }
      );
    }

    const cobranza = await registrarCobranza(resultado.data.clienteid, resultado.data.monto);
    if (!cobranza) return Response.json({ error: "Cliente no encontrado" }, { status: 404 });

    return responderJson(cobranza);
  } catch (error) {
    return responderError("POST /api/cobranza", error);
  }
}