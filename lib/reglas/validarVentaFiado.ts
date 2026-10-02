export function validarVentaFiado(
  clienteid: number | null,
  tipopago: number,
  esConsumidorFinal = false
): { ok: false; error: string } | { ok: true } {
  // tipopago = 1 → cuenta corriente
  const esFiado = tipopago === 1;

  if (esFiado && (!clienteid || esConsumidorFinal)) {
    return {
      ok: false,
      error: "Para una venta en cuenta corriente tiene que elegir un cliente.",
    };
  }

  return { ok: true };
}
