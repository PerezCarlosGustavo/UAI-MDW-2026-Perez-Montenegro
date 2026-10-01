import { requerirUsuario } from "@/lib/auth";
import { listarVentasVisiblesPara } from "@/lib/db/ventas";
import { responderJson } from "@/lib/utils";
import { responderError } from "@/lib/errores";

// Solo VENDEDOR. Para él es lo mismo que GET /api/ventas (ya filtra por su id);
// se mantiene porque está documentado en docs/api.md.
export async function GET() {
  try {
    const usuario = await requerirUsuario("VENDEDOR");

    const ventas = await listarVentasVisiblesPara(usuario);

    return responderJson(ventas);
  } catch (error) {
    return responderError("GET /api/ventas/mias", error);
  }
}
