import { describe, expect, it } from "vitest";
import { crearVentaSchema } from "@/lib/schemas/venta";
import { validarVenta } from "./validaciones";

const detalle = { productoid: 1, cantidad: 2, preciounitario: 750, subtotal: 1500 };

describe("validarVenta", () => {
  it("acepta una venta al contado (tipopago 0)", () => {
    const data = crearVentaSchema.parse({ tipopago: 0, total: 1500, detalles: [detalle] });

    expect(validarVenta(data).ok).toBe(true);
  });

  it("acepta una venta en cuenta corriente (tipopago 1)", () => {
    const data = crearVentaSchema.parse({ clienteid: 1, tipopago: 1, total: 1500, detalles: [detalle] });

    expect(validarVenta(data).ok).toBe(true);
  });

  it("rechaza una venta sin detalles", () => {
    const data = crearVentaSchema.parse({ tipopago: 0, total: 1500, detalles: [] });

    expect(validarVenta(data).ok).toBe(false);
  });
});

describe("crearVentaSchema", () => {
  it("rechaza un tipo de pago desconocido", () => {
    const resultado = crearVentaSchema.safeParse({ tipopago: 7, total: 1500, detalles: [detalle] });

    expect(resultado.success).toBe(false);
  });
});
