import { verificarPermiso } from "@/lib/auth/verificarPermiso";
import { modificarProducto } from "@/lib/casos/guardarProducto";
import { desactivarProducto, obtenerProducto } from "@/lib/db/productos";
import { responderJson } from "@/lib/utils";
import { validarProducto } from "@/lib/producto/validaciones";
import { responderError, responderRechazoProducto } from "@/lib/errores";
import { actualizarProductoSchema } from "@/lib/schemas/producto";

type Contexto = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Contexto) {
  try {
    await verificarPermiso("producto", "ver");

    const { id } = await params;
    const producto = await obtenerProducto(BigInt(id));

    if (!producto) {
      return Response.json({ error: "Producto no encontrado" }, { status: 404 });
    }

    return responderJson(producto);
  } catch (error) {
    return responderError("GET /api/productos/:id", error);
  }
}

export async function PUT(req: Request, { params }: Contexto) {
  try {
    await verificarPermiso("producto", "editar");

    const { id } = await params;
    const resultado = actualizarProductoSchema.safeParse(await req.json());
    if (!resultado.success) {
      return Response.json(
        { error: "Validación fallida", detalles: resultado.error.issues.map((issue) => issue.message) },
        { status: 400 }
      );
    }
    const data = resultado.data;

    const validacion = validarProducto(data);
    if (!validacion.ok) {
      return Response.json(
        { error: "Validación fallida", detalles: validacion.errores },
        { status: 400 }
      );
    }

    const guardado = await modificarProducto(BigInt(id), data);
    if (!guardado.ok) return responderRechazoProducto(guardado.motivo);

    return responderJson(guardado.producto);
  } catch (error) {
    return responderError("PUT /api/productos/:id", error);
  }
}

// DELETE = baja lógica (activo = false). La fila queda porque hay ventas que
// la referencian; el producto deja de aparecer en el catálogo y no se puede
// vender. Si el id no existe, responderError devuelve 404.
export async function DELETE(_req: Request, { params }: Contexto) {
  try {
    await verificarPermiso("producto", "borrar");

    const { id } = await params;
    const producto = await desactivarProducto(BigInt(id));

    return responderJson(producto);
  } catch (error) {
    return responderError("DELETE /api/productos/:id", error);
  }
}
