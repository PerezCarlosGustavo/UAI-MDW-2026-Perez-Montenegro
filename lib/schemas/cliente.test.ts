import { describe, expect, it } from "vitest";
import { listarClientesQuerySchema } from "./cliente";

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
