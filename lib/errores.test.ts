import { describe, expect, it, vi } from "vitest";
import { Prisma } from "@prisma/client";
import { ErrorAutorizacion } from "@/lib/auth/errores";
import { responderError } from "./errores";

function errorPrisma(code: string) {
  return new Prisma.PrismaClientKnownRequestError("error de prueba", {
    code,
    clientVersion: "test",
  });
}

describe("responderError", () => {
  it("traduce la falta de sesión a 401", async () => {
    const respuesta = responderError("test", new ErrorAutorizacion(401, "No autenticado"));

    expect(respuesta.status).toBe(401);
    expect(await respuesta.json()).toEqual({ error: "No autenticado" });
  });

  it("traduce el rol equivocado a 403", () => {
    const respuesta = responderError("test", new ErrorAutorizacion(403, "No autorizado"));

    expect(respuesta.status).toBe(403);
  });

  it("traduce un id que no es número a 400", () => {
    let error: unknown;
    try {
      BigInt("abc");
    } catch (e) {
      error = e;
    }

    expect(responderError("test", error).status).toBe(400);
  });

  it("traduce un registro inexistente de Prisma a 404", () => {
    expect(responderError("test", errorPrisma("P2025")).status).toBe(404);
  });

  it("traduce un valor único duplicado a 409", () => {
    expect(responderError("test", errorPrisma("P2002")).status).toBe(409);
  });

  it("responde 500 sin detalles ante lo no previsto, y lo loguea", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});

    const respuesta = responderError("GET /api/prueba", new Error("se rompió la base"));

    expect(respuesta.status).toBe(500);
    expect(await respuesta.json()).toEqual({ error: "Error interno" });
    expect(log).toHaveBeenCalledWith("GET /api/prueba", expect.any(Error));

    log.mockRestore();
  });
});
