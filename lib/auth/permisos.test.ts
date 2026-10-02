import { describe, expect, it } from "vitest";
import { PERMISOS } from "./permisos";

// La matriz de permisos es la regla de autorización de todo el sistema: si
// alguien la cambia sin querer, estos tests avisan.
describe("PERMISOS", () => {
  it("solo ADMIN puede dar de baja productos y clientes", () => {
    expect(PERMISOS.producto.borrar).toEqual(["ADMIN"]);
    expect(PERMISOS.cliente.borrar).toEqual(["ADMIN"]);
  });

  it("VENDEDOR puede ver productos pero no crearlos ni editarlos", () => {
    expect(PERMISOS.producto.ver).toContain("VENDEDOR");
    expect(PERMISOS.producto.crear).not.toContain("VENDEDOR");
    expect(PERMISOS.producto.editar).not.toContain("VENDEDOR");
  });

  it("VENDEDOR puede crear clientes pero no editarlos", () => {
    expect(PERMISOS.cliente.crear).toContain("VENDEDOR");
    expect(PERMISOS.cliente.editar).not.toContain("VENDEDOR");
  });

  it("ADMIN y VENDEDOR pueden consultar y cobrar cuentas corrientes", () => {
    expect(PERMISOS.cuentacorriente.ver).toEqual(["ADMIN", "VENDEDOR"]);
    expect(PERMISOS.cuentacorriente.cobrar).toEqual(["ADMIN", "VENDEDOR"]);
  });

  it("PENDIENTE no tiene ningún permiso", () => {
    const todos = Object.values(PERMISOS).flatMap((acciones) => Object.values(acciones).flat());

    expect(todos).not.toContain("PENDIENTE");
  });
});
