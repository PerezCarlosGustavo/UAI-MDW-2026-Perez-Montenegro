export function calcularFIFO(
  pendientes: { productoid: number; cantidad: number; precioPagado: number }[],
  monto: number
) {
  const pagados: { productoid: number; cantidad: number; precioPagado: number }[] = [];
  let saldoAFavor = 0;

  for (const item of pendientes) {
    const costoItem = item.cantidad * item.precioPagado;

    if (monto >= costoItem) {
      // Se paga completo
      pagados.push(item);
      monto -= costoItem;
    } else {
      // No alcanza para pagar el ítem más antiguo → error
      return {
        ok: false,
        error: "No alcanza para cubrir el ítem más antiguo",
        item,
      };
    }
  }

  // Si sobra dinero → saldo a favor
  saldoAFavor = monto;

  return {
    ok: true,
    pagados,
    saldoAFavor,
  };
}
