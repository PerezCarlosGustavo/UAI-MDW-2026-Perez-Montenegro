import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/db/client";
import { listarCategorias, listarCategoriasPaginadas } from "./categorias";

vi.mock("@/lib/db/client", () => ({
  prisma: { categoria: { findMany: vi.fn(), count: vi.fn() } },
}));

describe("listado de categorías", () => {
  beforeEach(() => vi.clearAllMocks());

  it("permite elegir una categoría agregada después de las primeras diez", async () => {
    const categorias = Array.from({ length: 11 }, (_, i) => ({ id: BigInt(i + 1), nombre: `Categoría ${i + 1}`, activa: true }));
    vi.mocked(prisma.categoria.findMany).mockResolvedValue(categorias);

    const resultado = await listarCategorias();

    expect(resultado).toHaveLength(11);
    expect(prisma.categoria.findMany).toHaveBeenCalledWith({ orderBy: { nombre: "asc" }, take: 100 });
  });

  it("pagina el listado de categorías de a diez", async () => {
    vi.mocked(prisma.categoria.findMany).mockResolvedValue([{ id: 11n, nombre: "Última", activa: true }]);
    vi.mocked(prisma.categoria.count).mockResolvedValue(11);

    const resultado = await listarCategoriasPaginadas(2);

    expect(prisma.categoria.findMany).toHaveBeenCalledWith({ orderBy: { nombre: "asc" }, skip: 10, take: 10 });
    expect(resultado.totalPaginas).toBe(2);
    expect(resultado.categorias).toHaveLength(1);
  });
});
