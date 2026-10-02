import { TIPO_MOVIMIENTO_CC } from "./tiposMovimientoCuentaCorriente";

export function calcularSaldoAFavor(
  movimientos: { tipo: number; importe: number }[]
) {
  let saldo = 0;

  for (const mov of movimientos) {
    if (mov.tipo === TIPO_MOVIMIENTO_CC.SALDO_A_FAVOR) {
      saldo += mov.importe;
    } else if (mov.tipo === TIPO_MOVIMIENTO_CC.SALDO_A_FAVOR_UTILIZADO) {
      saldo -= mov.importe;
    }
  }

  return { saldo: Math.round(saldo * 100) / 100 };
}
