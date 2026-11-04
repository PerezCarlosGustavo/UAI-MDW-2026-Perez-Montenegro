import { verificarPermiso } from "@/lib/auth/verificarPermiso";
import { responderJson } from "@/lib/utils";
import { registrarVenta } from "@/lib/casos/registrarVenta";
import { listarVentasVisiblesPara } from "@/lib/db/ventas";
import { responderError } from "@/lib/errores";
import { crearVentaSchema, listarVentasQuerySchema } from "@/lib/schemas/venta";

// GET /api/ventas?pagina=N → ADMIN ve todas; VENDEDOR, solo las suyas.
export async function GET(req: Request) {
  try {
    const usuario = await verificarPermiso("venta", "ver");

    const query = Object.fromEntries(new URL(req.url).searchParams);
    const resultado = listarVentasQuerySchema.safeParse(query);
    if (!resultado.success) {
      return Response.json(
        { error: "Validación fallida", detalles: resultado.error.issues.map((issue) => issue.message) },
        { status: 400 }
      );
    }

    const ventas = await listarVentasVisiblesPara(usuario, resultado.data.pagina);

    return responderJson(ventas);
  } catch (error) {
    return responderError("GET /api/ventas", error);
  }
}

export async function POST(req: Request) {
  try {
    // El usuario sale de la sesión, nunca del body: la venta queda a nombre
    // de quien la registra.
    const usuario = await verificarPermiso("venta", "crear");

    const resultado = crearVentaSchema.safeParse(await req.json());
    if (!resultado.success) {
      return Response.json(
        { error: "Validación fallida", detalles: resultado.error.issues.map((issue) => issue.message) },
        { status: 400 }
      );
    }
    const registro = await registrarVenta(resultado.data, usuario.id);
    if (!registro.ok) {
      return Response.json(
        { error: "Reglas de negocio fallidas", detalles: registro.errores },
        { status: 409 }
      );
    }
    return responderJson({ ...registro.venta, advertencias: registro.advertencias }, 201);

  } catch (error) {
    return responderError("POST /api/ventas", error);
  }
}
