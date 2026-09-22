export function calcularSaldoAFavor(
  movimientos: { tipo: number; importe: number }[]
) {
  // tipo = 2 → saldo a favor
  let saldo = 0;

  for (const mov of movimientos) {
    if (mov.tipo === 2) {
      saldo += mov.importe;
    }
  }

  return { saldo };
}
