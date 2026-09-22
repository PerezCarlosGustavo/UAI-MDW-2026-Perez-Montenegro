export function validarVenta(data: any) {
  const errores: string[] = [];

  if (!data.tipopago) {
    errores.push("El tipo de pago es obligatorio.");
  }

  if (!Array.isArray(data.detalles) || data.detalles.length === 0) {
    errores.push("La venta debe tener al menos un detalle.");
  }

  if (data.total <= 0) {
    errores.push("El total debe ser mayor a 0.");
  }

  // Validar cada detalle
  for (const d of data.detalles) {
    if (!d.productoid) errores.push("Cada detalle debe tener un producto.");
    if (d.cantidad <= 0) errores.push("La cantidad debe ser mayor a 0.");
    if (d.preciounitario <= 0) errores.push("El precio unitario debe ser mayor a 0.");
    if (d.subtotal <= 0) errores.push("El subtotal debe ser mayor a 0.");
  }

  if (errores.length > 0) {
    return { ok: false, errores };
  }

  return { ok: true };
}
