import { Prisma } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { modificarProducto, registrarProducto } from "./guardarProducto";
import { existeCategoria } from "@/lib/db/categorias";
import { actualizarProducto, crearProducto } from "@/lib/db/productos";

vi.mock("@/lib/db/categorias", () => ({ existeCategoria: vi.fn() }));
vi.mock("@/lib/db/productos", () => ({ crearProducto: vi.fn(), actualizarProducto: vi.fn() }));

const datos = {
  nombre: "Yerba",
  categoriaid: 2,
  codigobarra: "779",
  preciolista: 2500,
  permitestock: true,
  stockactual: 0,
  stockminimo: 0,
  activo: true,
};

const errorPrisma = (code: string) =>
  new Prisma.PrismaClientKnownRequestError("error", { code, clientVersion: "test" });

describe("guardarProducto", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(existeCategoria).mockResolvedValue(true);
  });

  it("rechaza una categoría que no existe, sin intentar guardar", async () => {
    vi.mocked(existeCategoria).mockResolvedValue(false);

    expect(await registrarProducto(datos)).toEqual({ ok: false, motivo: "categoria_inexistente" });
    expect(crearProducto).not.toHaveBeenCalled();
  });

  it("traduce el código de barras repetido a un motivo", async () => {
    vi.mocked(crearProducto).mockRejectedValue(errorPrisma("P2002"));

    expect(await registrarProducto(datos)).toEqual({ ok: false, motivo: "codigo_repetido" });
  });

  it("traduce el producto que ya no existe a un motivo", async () => {
    vi.mocked(actualizarProducto).mockRejectedValue(errorPrisma("P2025"));

    expect(await modificarProducto(1n, { preciolista: 10 })).toEqual({ ok: false, motivo: "producto_inexistente" });
  });

  it("no consulta la categoría si no se está cambiando", async () => {
    vi.mocked(actualizarProducto).mockResolvedValue({ id: 1n } as never);

    const resultado = await modificarProducto(1n, { preciolista: 10 });

    expect(resultado.ok).toBe(true);
    expect(existeCategoria).not.toHaveBeenCalled();
  });

  it("lo imprevisto no se disfraza de rechazo", async () => {
    vi.mocked(crearProducto).mockRejectedValue(new Error("se cayó la base"));

    await expect(registrarProducto(datos)).rejects.toThrow("se cayó la base");
  });
});
