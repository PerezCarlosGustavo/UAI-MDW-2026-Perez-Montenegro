import type { MovimientoCuentaCorriente } from "./calcularFIFO";
import { calcularSaldoAFavor } from "./calcularSaldoAFavor";
import { TIPO_MOVIMIENTO_CC } from "./tiposMovimientoCuentaCorriente";

/**
 * Un cobro no tiene tabla propia (ADR 0008): es un movimiento de pago seguido de
 * los movimientos que generó. Llegan hasta el pago siguiente, y las ventas fiadas
 * que cayeron en el medio no son parte de él.
 *
 * `movimientos` son los de una cuenta, ordenados por id. `null` si `pagoid` no
 * es un pago de esa cuenta.
 */
export function armarComprobanteCobro(movimientos: MovimientoCuentaCorriente[], pagoid: number) {
  const inicio = movimientos.findIndex(
    (movimiento) => movimiento.id === pagoid && movimiento.tipo === TIPO_MOVIMIENTO_CC.PAGO_RECIBIDO
  );
  const pago = movimientos[inicio];
  if (!pago) return null;

  const siguiente = movimientos.findIndex(
    (movimiento, indice) => indice > inicio && movimiento.tipo === TIPO_MOVIMIENTO_CC.PAGO_RECIBIDO
  );
  const hastaEsteCobro = siguiente === -1 ? movimientos : movimientos.slice(0, siguiente);
  const delCobro = hastaEsteCobro.slice(inicio + 1);
  const sumar = (tipo: number) =>
    delCobro.filter((movimiento) => movimiento.tipo === tipo).reduce((total, movimiento) => total + movimiento.importe, 0);

  return {
    cobranzaid: pago.id,
    fecha: pago.fecha,
    montoRecibido: pago.importe,
    liquidados: delCobro
      .filter((movimiento) => movimiento.tipo === TIPO_MOVIMIENTO_CC.PRODUCTO_LIQUIDADO)
      .map((movimiento) => ({
        productoid: movimiento.productoid,
        cantidad: movimiento.cantidad ?? 0,
        importe: movimiento.importe,
      })),
    saldoAFavorUsado: sumar(TIPO_MOVIMIENTO_CC.SALDO_A_FAVOR_UTILIZADO),
    saldoAFavorGenerado: sumar(TIPO_MOVIMIENTO_CC.SALDO_A_FAVOR),
    saldoAFavor: calcularSaldoAFavor(hastaEsteCobro).saldo,
  };
}
