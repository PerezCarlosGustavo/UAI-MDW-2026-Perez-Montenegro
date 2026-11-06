import { beforeEach, describe, expect, it, vi } from "vitest";
import { Prisma } from "@prisma/client";
import { getServerSession } from "next-auth";
import { crearCategoria } from "@/lib/db/categorias";
import { POST } from "./route";

vi.mock("next-auth", () => ({ getServerSession: vi.fn() }));
vi.mock("next-auth/providers/google", () => ({ default: vi.fn() }));
vi.mock("@/lib/db/client", () => ({ prisma: {} }));
vi.mock("@/lib/db/categorias", () => ({ crearCategoria: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

function sesionDe(rol: "ADMIN" | "VENDEDOR" | "PENDIENTE" | null) {
  vi.mocked(getServerSession).mockResolvedValue(
    rol ? { user: { id: 1, rol, nombre: "Prueba", email: "prueba@example.com" } } : null
  );
}

function solicitud(body: string) {
  return new Request("http://localhost/api/categorias", { method: "POST", headers: { "Content-Type": "application/json" }, body });
}

beforeEach(() => vi.resetAllMocks());

describe("POST /api/categorias", () => {
  it.each([[null, 401], ["PENDIENTE", 403], ["VENDEDOR", 403]] as const)("rechaza el rol %s con %s", async (rol, status) => {
    sesionDe(rol);
    expect((await POST(solicitud('{"nombre":"Bebidas"}'))).status).toBe(status);
    expect(crearCategoria).not.toHaveBeenCalled();
  });

  it("crea la categoría para ADMIN", async () => {
    sesionDe("ADMIN");
    vi.mocked(crearCategoria).mockResolvedValue({ id: 1n, nombre: "Bebidas", activa: true });
    const respuesta = await POST(solicitud('{"nombre":" Bebidas "}'));
    expect(respuesta.status).toBe(201);
    expect(await respuesta.json()).toEqual({ id: 1, nombre: "Bebidas", activa: true });
    expect(crearCategoria).toHaveBeenCalledWith({ nombre: "Bebidas", activa: true });
  });

  it.each(['{"nombre":" "}', '{"nombre":1}', '{'])('rechaza datos inválidos: %s', async (body) => {
    sesionDe("ADMIN");
    expect((await POST(solicitud(body))).status).toBe(400);
    expect(crearCategoria).not.toHaveBeenCalled();
  });

  it("responde 409 ante un nombre duplicado", async () => {
    sesionDe("ADMIN");
    vi.mocked(crearCategoria).mockRejectedValue(new Prisma.PrismaClientKnownRequestError("duplicado", { code: "P2002", clientVersion: "test" }));
    expect((await POST(solicitud('{"nombre":"Bebidas"}'))).status).toBe(409);
  });
});
