export function validarProducto(data: any) {
  const errores: string[] = [];

  if (!data.nombre || data.nombre.trim().length === 0) {
    errores.push("El nombre es obligatorio.");
  }

  if (!data.categoriaid) {
    errores.push("La categoría es obligatoria.");
  }

  if (data.preciolista < 0) {
    errores.push("El precio de lista no puede ser negativo.");
  }

  if (data.stockactual < 0) {
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
