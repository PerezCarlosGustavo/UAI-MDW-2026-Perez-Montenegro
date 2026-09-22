export function validarStock(
  items: { productoid: number; cantidad: number; stockactual: number; permitestock: boolean }[]
) {
  const faltantes: { productoid: number; requerido: number; disponible: number }[] = [];

  for (const item of items) {
    if (item.permitestock && item.stockactual < item.cantidad) {
      faltantes.push({
        productoid: item.productoid,
        requerido: item.cantidad,
        disponible: item.stockactual,
      });
    }
  }

  return {
    ok: faltantes.length === 0,
    faltantes,
  };
}
