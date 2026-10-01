import { describe, expect, it } from "vitest";
import { filtroVentasVisiblesPara } from "./pertenencia";

describe("filtroVentasVisiblesPara", () => {
  it("el ADMIN ve todas las ventas (sin filtro)", () => {
    expect(filtroVentasVisiblesPara({ id: 1, rol: "ADMIN" })).toEqual({});
  });

  it("el VENDEDOR solo ve las suyas", () => {
    expect(filtroVentasVisiblesPara({ id: 7, rol: "VENDEDOR" })).toEqual({ usuarioid: 7n });
  });

  it("cualquier otro rol también queda filtrado por su id, nunca ve todo", () => {
    expect(filtroVentasVisiblesPara({ id: 9, rol: "PENDIENTE" })).toEqual({ usuarioid: 9n });
  });
});
