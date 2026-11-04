import { describe, expect, it } from "vitest";
import { actualizarClienteSchema, crearClienteSchema, listarClientesQuerySchema } from "./cliente";

describe("listarClientesQuerySchema", () => {
  it("por defecto no incluye inactivos", () => {
    expect(listarClientesQuerySchema.parse({})).toEqual({ incluirInactivos: false });
  });

  it("acepta true y false como texto (así llegan en el query string)", () => {
    expect(listarClientesQuerySchema.parse({ incluirInactivos: "true" })).toEqual({ incluirInactivos: true });
    expect(listarClientesQuerySchema.parse({ incluirInactivos: "false" })).toEqual({ incluirInactivos: false });
  });

  it("rechaza cualquier otro valor en vez de tomarlo como false", () => {
    expect(listarClientesQuerySchema.safeParse({ incluirInactivos: "si" }).success).toBe(false);
  });
});


describe("validación del teléfono de clientes", () => {
  it.each(["abcdef", "341abc1234", "3415551234ext2"])("rechaza letras en %s debajo del campo teléfono", (telefono) => {
    for (const schema of [crearClienteSchema, actualizarClienteSchema]) {
      const resultado = schema.safeParse({ nombre: "Ana", telefono });
      expect(resultado.success).toBe(false);
      if (!resultado.success) {
        expect(resultado.error.flatten().fieldErrors.telefono).toHaveLength(1);
      }
    }
  });

  it.each(["3415551234", "+54 (341) 555-1234", "341.555.1234", "", null, undefined])("acepta el teléfono opcional o formateado %s", (telefono) => {
    expect(crearClienteSchema.safeParse({ nombre: "Ana", telefono }).success).toBe(true);
    expect(actualizarClienteSchema.safeParse({ telefono }).success).toBe(true);
  });
});
