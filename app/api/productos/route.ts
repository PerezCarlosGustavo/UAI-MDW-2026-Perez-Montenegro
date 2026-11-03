import { verificarPermiso } from "@/lib/auth/verificarPermiso";
import { registrarProducto } from "@/lib/casos/guardarProducto";
import { buscarProductosParaVender, listarProductosActivos } from "@/lib/db/productos";
import { responderJson } from "@/lib/utils";
import { validarProducto } from "@/lib/producto/validaciones";
import { responderError, responderRechazoProducto } from "@/lib/errores";
import { buscarProductosQuerySchema, crearProductoSchema } from "@/lib/schemas/producto";

// GET /api/productos?q=texto → busca por nombre o código de barras.
export async function GET(req: Request) {
  try {
    await verificarPermiso("producto", "ver");

    const query = Object.fromEntries(new URL(req.url).searchParams);
    const resultado = buscarProductosQuerySchema.safeParse(query);
    if (!resultado.success) {
      return Response.json(
        { error: "Validación fallida", detalles: resultado.error.issues.map((issue) => issue.message) },
        { status: 400 }
      );
    }

    const { q } = resultado.data;
    const productos = q ? await buscarProductosParaVender(q) : await listarProductosActivos();

    return responderJson(productos);
  } catch (error) {
    return responderError("GET /api/productos", error);
  }
}

export async function POST(req: Request) {
  try {
    await verificarPermiso("producto", "crear");

    const resultado = crearProductoSchema.safeParse(await req.json());
    if (!resultado.success) {
      return Response.json(
        { error: "Validación fallida", detalles: resultado.error.issues.map((issue) => issue.message) },
        { status: 400 }
      );
    }
    const data = resultado.data;

    // Validaciones básicas (forma)
    const validacion = validarProducto(data);
    if (!validacion.ok) {
      return Response.json(
        { error: "Validación fallida", detalles: validacion.errores },
        { status: 400 }
      );
    }

    // Reglas de negocio: las mismas que usa el formulario (clase 12).
    const guardado = await registrarProducto(data);
    if (!guardado.ok) return responderRechazoProducto(guardado.motivo);

    return responderJson(guardado.producto, 201);
  } catch (error) {
    return responderError("POST /api/productos", error);
  }
}
