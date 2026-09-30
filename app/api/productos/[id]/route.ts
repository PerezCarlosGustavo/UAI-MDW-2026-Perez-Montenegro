import { verificarPermiso } from "@/lib/auth/verificarPermiso";
import { prisma } from "@/lib/db/client";
import { responderJson } from "@/lib/utils";
import { validarProducto } from "@/lib/producto/validaciones";
import { validarReglasProducto } from "@/lib/producto/reglas";
import { respuestaErrorAutorizacion } from "@/lib/auth/errores";
import { actualizarProductoSchema } from "@/lib/schemas/producto";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await verificarPermiso("producto", "editar");
  } catch (error) {
    return respuestaErrorAutorizacion(error) ?? Response.json({ error: "Error interno" }, { status: 500 });
  }

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

  const reglas = await validarReglasProducto(data);
  if (!reglas.ok) {
    return Response.json(
      { error: "Reglas de negocio fallidas", detalles: reglas.errores },
      { status: 409 }
    );
  }

  const producto = await prisma.producto.update({
    where: { id: BigInt(id) },
    data,
  });

  return responderJson(producto);
}
