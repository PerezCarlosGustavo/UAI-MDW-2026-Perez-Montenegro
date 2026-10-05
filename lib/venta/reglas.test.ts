import { describe, expect, it } from "vitest";
import { armarVenta, type ProductoParaVenta } from "./reglas";

const gaseosa: ProductoParaVenta = {
  id: 1,
  nombre: "GASEOSA",
  preciolista: 2500,
  permitestock: true,
  stockactual: 10,
  activo: true,
};

const pan: ProductoParaVenta = {
  id: 2,
  nombre: "PAN",
  preciolista: 1800.5,
  permitestock: false,
  stockactual: 0,
  activo: true,
};

const contado = (detalles: { productoid: number; cantidad: number }[]) => ({
  tipopago: 0 as const,
  detalles,
});

const cuentaCorriente = (detalles: { productoid: number; cantidad: number }[]) => ({
  tipopago: 1 as const,
  detalles,
});

describe("armarVenta", () => {
  it("usa el precio del catálogo y calcula subtotales y total", () => {
    const venta = armarVenta(
      contado([
        { productoid: 1, cantidad: 2 },
        { productoid: 2, cantidad: 0.5 },
      ]),
      [gaseosa, pan],
      undefined
    );

    expect(venta.ok).toBe(true);
    if (!venta.ok) return;
    expect(venta.lineas).toEqual([
      { productoid: 1, cantidad: 2, preciounitario: 2500, subtotal: 5000 },
      { productoid: 2, cantidad: 0.5, preciounitario: 1800.5, subtotal: 900.25 },
    ]);
    expect(venta.total).toBe(5900.25);
  });

  it("solo descuenta stock de productos con permitestock", () => {
    const venta = armarVenta(
      contado([
        { productoid: 1, cantidad: 2 },
        { productoid: 2, cantidad: 3 },
      ]),
      [gaseosa, pan],
      undefined
    );

    expect(venta.ok && venta.descuentosDeStock).toEqual([{ productoid: 1, cantidad: 2 }]);
  });

  it("con stock insuficiente vende igual y avisa (stock negativo, ADR 0004)", () => {
    const venta = armarVenta(contado([{ productoid: 1, cantidad: 12 }]), [gaseosa], undefined);

    expect(venta.ok).toBe(true);
    if (!venta.ok) return;
    expect(venta.descuentosDeStock).toEqual([{ productoid: 1, cantidad: 12 }]);
    expect(venta.advertencias).toHaveLength(1);
    expect(venta.advertencias[0]).toContain("GASEOSA");
  });

  it("borde: el mismo producto en dos líneas suma para el stock", () => {
    const venta = armarVenta(
      contado([
        { productoid: 1, cantidad: 6 },
        { productoid: 1, cantidad: 6 },
      ]),
      [gaseosa],
      undefined
    );

    expect(venta.ok).toBe(true);
    if (!venta.ok) return;
    expect(venta.descuentosDeStock).toEqual([{ productoid: 1, cantidad: 12 }]);
    expect(venta.advertencias).toHaveLength(1);
  });

  it("rechaza un producto que no existe", () => {
    const venta = armarVenta(contado([{ productoid: 99, cantidad: 1 }]), [gaseosa], undefined);

    expect(venta.ok).toBe(false);
  });

  it("rechaza un producto inactivo", () => {
    const venta = armarVenta(
      contado([{ productoid: 1, cantidad: 1 }]),
      [{ ...gaseosa, activo: false }],
      undefined
    );

    expect(venta.ok).toBe(false);
  });

  it("rechaza un cliente que no existe o está inactivo", () => {
    const pedido = { ...contado([{ productoid: 1, cantidad: 1 }]), clienteid: 5 };

    expect(armarVenta(pedido, [gaseosa], null).ok).toBe(false);
    expect(armarVenta(pedido, [gaseosa], { activo: false, documento: "123" }).ok).toBe(false);
    expect(armarVenta(pedido, [gaseosa], { activo: true, documento: "123" }).ok).toBe(true);
  });

  it("exige un cliente real para una venta en cuenta corriente", () => {
    const sinCliente = armarVenta(
      cuentaCorriente([{ productoid: 1, cantidad: 1 }]),
      [gaseosa],
      undefined
    );
    const consumidorFinal = armarVenta(
      { ...cuentaCorriente([{ productoid: 1, cantidad: 1 }]), clienteid: 5 },
      [gaseosa],
      { activo: true, documento: "0" }
    );

    expect(sinCliente).toMatchObject({
      ok: false,
      errores: ["Para una venta en cuenta corriente tiene que elegir un cliente."],
    });
    expect(consumidorFinal).toMatchObject({
      ok: false,
      errores: ["Para una venta en cuenta corriente tiene que elegir un cliente."],
    });
  });

  it("acepta una venta en cuenta corriente con un cliente regular", () => {
    const venta = armarVenta(
      { ...cuentaCorriente([{ productoid: 1, cantidad: 1 }]), clienteid: 5 },
      [gaseosa],
      { activo: true, documento: "123" }
    );

    expect(venta.ok).toBe(true);
  });
});
