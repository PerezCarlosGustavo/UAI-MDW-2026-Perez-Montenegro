import { describe, expect, it } from "vitest";
import { calcularFIFO, reconstruirPendientes, type MovimientoCuentaCorriente } from "./calcularFIFO";
import { calcularSaldoAFavor } from "./calcularSaldoAFavor";
import { TIPO_MOVIMIENTO_CC } from "./tiposMovimientoCuentaCorriente";

const fecha = new Date("2026-09-30T12:00:00.000Z");

const pendiente = (overrides: Partial<Parameters<typeof calcularFIFO>[0][number]> = {}) => ({
  movimientoid: 1,
  ventaid: 10,
  productoid: 2,
  nombre: "Producto",
  cantidad: 1,
  preciounitario: 100,
  fecha,
  ...overrides,
});

describe("calcularFIFO", () => {
  it("no fracciona el producto y conserva el pago como saldo a favor", () => {
    const resultado = calcularFIFO([pendiente()], 60);

    expect(resultado.pagados).toEqual([]);
    expect(resultado.saldoAFavor).toBe(60);
    expect(resultado.saldoAFavorGenerado).toBe(60);
  });

  it("consume saldo previo primero y respeta el orden FIFO", () => {
    const resultado = calcularFIFO(
      [pendiente({ preciounitario: 80 }), pendiente({ movimientoid: 2, ventaid: 11, preciounitario: 50 })],
      50,
      30
    );

    expect(resultado.pagados.map((item) => item.movimientoid)).toEqual([1]);
    expect(resultado.saldoAFavorUsado).toBe(30);
    expect(resultado.saldoAFavorGenerado).toBe(0);
    expect(resultado.saldoAFavor).toBe(0);
  });

  it("no saltea el pendiente más antiguo aunque otro cueste menos", () => {
    const resultado = calcularFIFO(
      [pendiente({ preciounitario: 80 }), pendiente({ movimientoid: 2, ventaid: 11, preciounitario: 50 })],
      50
    );

    expect(resultado.pagados).toEqual([]);
    expect(resultado.saldoAFavor).toBe(50);
  });
});

describe("reconstruirPendientes", () => {
  it("aplica liquidaciones a la deuda original y mantiene otras ventas", () => {
    const movimientos: MovimientoCuentaCorriente[] = [
      {
        id: 1,
        ventaid: 10,
        productoid: 2,
        tipo: TIPO_MOVIMIENTO_CC.DEUDA_VENTA,
        cantidad: 2,
        importe: 0,
        fecha,
      },
      {
        id: 2,
        ventaid: 11,
        productoid: 2,
        tipo: TIPO_MOVIMIENTO_CC.DEUDA_VENTA,
        cantidad: 1,
        importe: 0,
        fecha,
      },
      {
        id: 3,
        ventaid: 10,
        productoid: 2,
        tipo: TIPO_MOVIMIENTO_CC.PRODUCTO_LIQUIDADO,
        cantidad: 1,
        importe: 100,
        fecha,
      },
    ];

    expect(reconstruirPendientes(movimientos).map(({ ventaid, cantidad }) => ({ ventaid, cantidad }))).toEqual([
      { ventaid: 10, cantidad: 1 },
      { ventaid: 11, cantidad: 1 },
    ]);
  });
});

describe("calcularSaldoAFavor", () => {
  it("resta del saldo los créditos ya utilizados", () => {
    expect(
      calcularSaldoAFavor([
        { tipo: TIPO_MOVIMIENTO_CC.SALDO_A_FAVOR, importe: 80 },
        { tipo: TIPO_MOVIMIENTO_CC.SALDO_A_FAVOR_UTILIZADO, importe: 30 },
      ])
    ).toEqual({ saldo: 50 });
  });
});