import { prisma } from "@/lib/db/client";
import type { ActualizarProductoInput, CrearProductoInput } from "@/lib/schemas/producto";

export async function validarReglasProducto(data: ActualizarProductoInput | CrearProductoInput) {
  const errores: string[] = [];

  // Categoría debe existir
  if (data.categoriaid !== undefined) {
    const categoria = await prisma.categoria.findUnique({
      where: { id: BigInt(data.categoriaid) },
    });

    if (!categoria) {
      errores.push("La categoría indicada no existe.");
    }
  }

  // Precio de lista
  if (data.preciolista !== undefined && data.preciolista < 0) {
    errores.push("El precio de lista no puede ser negativo.");
  }

  // Stock
  if (data.stockactual !== undefined && data.stockactual < 0) {
    errores.push("El stock actual no puede ser negativo.");
  }

  if (data.permitestock === false && Number(data.stockactual) !== 0) {
    errores.push("Si el producto no permite stock, el stock actual debe ser 0.");
  }

  if (errores.length > 0) {
    return { ok: false, errores };
  }

  return { ok: true };
}
