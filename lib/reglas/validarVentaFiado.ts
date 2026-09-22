export function validarVentaFiado(clienteid: number | null, tipopago: number) {
  // tipopago = 1 → cuenta corriente
  const esFiado = tipopago === 1;

  if (esFiado && !clienteid) {
    return {
      ok: false,
      error: "Venta fiada sin cliente",
    };
  }

  return { ok: true };
}
