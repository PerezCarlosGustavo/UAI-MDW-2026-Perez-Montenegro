import { describe, expect, it } from "vitest";
import { crearVentaSchema } from "./venta";

const detalle = { productoid: 1, cantidad: 2 };

describe("crearVentaSchema", () => {
  it("acepta una venta al contado (tipopago 0)", () => {
    expect(crearVentaSchema.safeParse({ tipopago: 0, detalles: [detalle] }).success).toBe(true);
  });

  it("acepta una venta en cuenta corriente (tipopago 1)", () => {
    expect(
      crearVentaSchema.safeParse({ clienteid: 1, tipopago: 1, detalles: [detalle] }).success
    ).toBe(true);
  });

  it("rechaza un tipo de pago desconocido", () => {
    expect(crearVentaSchema.safeParse({ tipopago: 7, detalles: [detalle] }).success).toBe(false);
  });

  it("rechaza una venta sin productos", () => {
    expect(crearVentaSchema.safeParse({ tipopago: 0, detalles: [] }).success).toBe(false);
  });

  it("rechaza cantidad cero o negativa", () => {
    expect(
      crearVentaSchema.safeParse({ tipopago: 0, detalles: [{ productoid: 1, cantidad: 0 }] }).success
    ).toBe(false);
  });

  it("descarta el precio y el total que manda el cliente", () => {
    const datos = crearVentaSchema.parse({
      tipopago: 0,
      total: 1,
      detalles: [{ productoid: 1, cantidad: 2, preciounitario: 1, subtotal: 2 }],
    });

    expect(datos).not.toHaveProperty("total");
    expect(datos.detalles[0]).toEqual({ productoid: 1, cantidad: 2 });
  });
});
