export function calcularTotalVenta(items: { cantidad: number; preciolista: number }[]) {
  let total = 0;

  for (const item of items) {
    total += item.cantidad * item.preciolista;
  }

  return {
    total,
  };
}
