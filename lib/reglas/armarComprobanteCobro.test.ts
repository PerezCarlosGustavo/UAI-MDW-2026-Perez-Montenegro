import { describe, expect, it } from "vitest";
import type { MovimientoCuentaCorriente } from "./calcularFIFO";
import { armarComprobanteCobro } from "./armarComprobanteCobro";
import { TIPO_MOVIMIENTO_CC as TIPO } from "./tiposMovimientoCuentaCorriente";

const FECHA = new Date("2026-11-05T12:00:00Z");

function movimiento(
  id: number,
  tipo: number,
  importe: number,
  extra: Partial<MovimientoCuentaCorriente> = {}
): MovimientoCuentaCorriente {
  return { id, tipo, importe, ventaid: null, productoid: null, cantidad: null, fecha: FECHA, ...extra };
}

describe("armarComprobanteCobro", () => {
  it("un pago que no alcanza no liquida nada y queda todo como saldo a favor", () => {
    const comprobante = armarComprobanteCobro([
      movimiento(1, TIPO.DEUDA_VENTA, 1400, { ventaid: 1, productoid: 7, cantidad: 2 }),
      movimiento(2, TIPO.PAGO_RECIBIDO, 1000),
      movimiento(3, TIPO.SALDO_A_FAVOR, 1000),
    ], 2);

    expect(comprobante).toMatchObject({
      cobranzaid: 2,
      montoRecibido: 1000,
      liquidados: [],
      saldoAFavorUsado: 0,
      saldoAFavorGenerado: 1000,
      saldoAFavor: 1000,
    });
  });

  it("muestra lo liquidado, el saldo que usó y el que generó", () => {
    const comprobante = armarComprobanteCobro([
      movimiento(1, TIPO.DEUDA_VENTA, 1400, { ventaid: 1, productoid: 7, cantidad: 2 }),
      movimiento(2, TIPO.PAGO_RECIBIDO, 1000),
      movimiento(3, TIPO.SALDO_A_FAVOR, 1000),
      movimiento(4, TIPO.PAGO_RECIBIDO, 700),
      movimiento(5, TIPO.SALDO_A_FAVOR_UTILIZADO, 1000),
      movimiento(6, TIPO.PRODUCTO_LIQUIDADO, 1600, { ventaid: 1, productoid: 7, cantidad: 2 }),
      movimiento(7, TIPO.SALDO_A_FAVOR, 100),
    ], 4);

    expect(comprobante).toMatchObject({
      montoRecibido: 700,
      liquidados: [{ productoid: 7, cantidad: 2, importe: 1600 }],
      saldoAFavorUsado: 1000,
      saldoAFavorGenerado: 100,
      saldoAFavor: 100,
    });
  });

  it("un cobro viejo no toma lo del cobro siguiente, y sigue mostrando el saldo de ese momento", () => {
    const comprobante = armarComprobanteCobro([
      movimiento(1, TIPO.PAGO_RECIBIDO, 500),
      movimiento(2, TIPO.SALDO_A_FAVOR, 500),
      movimiento(3, TIPO.PAGO_RECIBIDO, 200),
      movimiento(4, TIPO.SALDO_A_FAVOR, 200),
    ], 1);

    expect(comprobante).toMatchObject({ saldoAFavorGenerado: 500, saldoAFavor: 500 });
  });

  it("una venta fiada posterior al cobro no aparece en el comprobante", () => {
    const comprobante = armarComprobanteCobro([
      movimiento(1, TIPO.PAGO_RECIBIDO, 500),
      movimiento(2, TIPO.SALDO_A_FAVOR, 500),
      movimiento(3, TIPO.DEUDA_VENTA, 900, { ventaid: 2, productoid: 8, cantidad: 1 }),
    ], 1);

    expect(comprobante?.liquidados).toEqual([]);
    expect(comprobante?.saldoAFavor).toBe(500);
  });

  it("devuelve null si el id no existe o no es un pago", () => {
    const movimientos = [movimiento(1, TIPO.DEUDA_VENTA, 900), movimiento(2, TIPO.PAGO_RECIBIDO, 100)];

    expect(armarComprobanteCobro(movimientos, 1)).toBeNull();
    expect(armarComprobanteCobro(movimientos, 99)).toBeNull();
  });
});
