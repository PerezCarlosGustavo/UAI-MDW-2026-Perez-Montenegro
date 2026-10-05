import type { ActualizarProductoInput, CrearProductoInput } from "@/lib/schemas/producto";

export function validarProducto(data: ActualizarProductoInput | CrearProductoInput) {
  const errores: string[] = [];

  if (data.nombre !== undefined && data.nombre.trim().length === 0) {
    errores.push("El nombre es obligatorio.");
  }

  if (data.preciolista !== undefined && data.preciolista < 0) {
    errores.push("El precio de lista no puede ser negativo.");
  }

  if (data.stockactual !== undefined && data.stockactual < 0) {
    errores.push("El stock no puede ser negativo.");
  }

  if (data.permitestock === false && data.stockactual !== 0) {
    errores.push("Si el producto no permite stock, el stock actual debe ser 0.");
  }

  if (errores.length > 0) {
    return { ok: false, errores };
  }

  return { ok: true };
}
