import { describe, expect, it } from "vitest";
import { validarCliente } from "./validaciones";

describe("validarCliente", () => {
  it("rechaza un documento en blanco aunque el nombre y teléfono sean válidos", () => {
    const resultado = validarCliente({
      nombre: "Ana García",
      documento: "   ",
      telefono: "3415551234",
    });

    expect(resultado.ok).toBe(false);
    expect(resultado.errores).toContain("El documento, si se informa, no puede quedar vacío.");
  });
});
