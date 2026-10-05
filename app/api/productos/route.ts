import { verificarPermiso } from "@/lib/auth/verificarPermiso";
import { crearProducto, listarProductosActivos } from "@/lib/db/productos";
import { responderJson } from "@/lib/utils";
import { validarProducto } from "@/lib/producto/validaciones";
import { validarReglasProducto } from "@/lib/producto/reglas";
import { responderError } from "@/lib/errores";
import { crearProductoSchema } from "@/lib/schemas/producto";

export async function GET() {
  try {
    await verificarPermiso("producto", "ver");

    const productos = await listarProductosActivos();

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

    // Reglas de negocio (clase 5)
    const reglas = await validarReglasProducto(data);
    if (!reglas.ok) {
      return Response.json(
        { error: "Reglas de negocio fallidas", detalles: reglas.errores },
        { status: 409 }
      );
    }

    const producto = await crearProducto(data);

    return responderJson(producto, 201);
  } catch (error) {
    return responderError("POST /api/productos", error);
  }
}
