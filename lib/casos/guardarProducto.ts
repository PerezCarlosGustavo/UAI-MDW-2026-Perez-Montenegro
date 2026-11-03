import { Prisma } from "@prisma/client";
import { existeCategoria } from "@/lib/db/categorias";
import { actualizarProducto, crearProducto } from "@/lib/db/productos";
import type { ActualizarProductoInput, CrearProductoInput } from "@/lib/schemas/producto";

// Las reglas de guardar un producto, una sola vez. Las usan el endpoint y la
// Server Action: este archivo no sabe que existen HTTP ni los formularios.
// Devuelve un motivo de un conjunto cerrado y cada puerta lo traduce (clase 12).

export type MotivoRechazoProducto = "categoria_inexistente" | "codigo_repetido" | "producto_inexistente";

export const MENSAJE_RECHAZO_PRODUCTO: Record<MotivoRechazoProducto, string> = {
  categoria_inexistente: "La categoría indicada no existe.",
  codigo_repetido: "Ya hay otro producto con ese código de barras.",
  producto_inexistente: "El producto ya no existe.",
};

type Guardado = Awaited<ReturnType<typeof crearProducto>>;
type Resultado = { ok: true; producto: Guardado } | { ok: false; motivo: MotivoRechazoProducto };

async function conReglas(categoriaid: number | undefined, guardar: () => Promise<Guardado>): Promise<Resultado> {
  if (categoriaid !== undefined && !(await existeCategoria(BigInt(categoriaid)))) {
    return { ok: false, motivo: "categoria_inexistente" };
  }

  // El código repetido no se pregunta antes: entre la pregunta y el guardado
  // otro podría cargar el mismo. Lo garantiza el @unique de la base.
  try {
    return { ok: true, producto: await guardar() };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") return { ok: false, motivo: "codigo_repetido" };
      if (error.code === "P2025") return { ok: false, motivo: "producto_inexistente" };
    }
    throw error;
  }
}

export function registrarProducto(datos: CrearProductoInput) {
  return conReglas(datos.categoriaid, () => crearProducto(datos));
}

export function modificarProducto(id: bigint, datos: ActualizarProductoInput) {
  return conReglas(datos.categoriaid, () => actualizarProducto(id, datos));
}
