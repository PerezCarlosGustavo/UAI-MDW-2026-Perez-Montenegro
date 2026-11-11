import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/db/client";
import { contarVentasVisiblesPara, listarResumenesVenta } from "./ventas";

vi.mock("@/lib/db/client", () => ({
  prisma: { venta: { findMany: vi.fn(), count: vi.fn() } },
}));

describe("resúmenes de ventas", () => {
  beforeEach(() => vi.clearAllMocks());

  it("limita las ventas recientes y aplica el filtro del vendedor", async () => {
    vi.mocked(prisma.venta.findMany).mockResolvedValue([]);
    await listarResumenesVenta({ id: 7, rol: "VENDEDOR" }, 1, 3);
    expect(prisma.venta.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { usuarioid: 7n }, take: 3, skip: 0,
      orderBy: [{ fecha: "desc" }, { id: "desc" }],
    }));
  });

  it("pagina diez ventas y cuenta solamente las visibles para el vendedor", async () => {
    vi.mocked(prisma.venta.findMany).mockResolvedValue([]);
    vi.mocked(prisma.venta.count).mockResolvedValue(11);
    const usuario = { id: 7, rol: "VENDEDOR" as const };
    await listarResumenesVenta(usuario, 2, 10);
    expect(await contarVentasVisiblesPara(usuario)).toBe(11);
    expect(prisma.venta.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { usuarioid: 7n }, take: 10, skip: 10 }));
    expect(prisma.venta.count).toHaveBeenCalledWith({ where: { usuarioid: 7n } });
  });
});
