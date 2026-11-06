import { beforeEach, describe, expect, it, vi } from "vitest";
import { Prisma } from "@prisma/client";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { crearCategoria } from "@/lib/db/categorias";
import { crearCategoriaAction } from "./acciones";

vi.mock("next-auth", () => ({ getServerSession: vi.fn() }));
vi.mock("next-auth/providers/google", () => ({ default: vi.fn() }));
vi.mock("@/lib/db/client", () => ({ prisma: {} }));
vi.mock("@/lib/db/categorias", () => ({ crearCategoria: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));

function sesionDe(rol: "ADMIN" | "VENDEDOR" | "PENDIENTE" | null) {
  vi.mocked(getServerSession).mockResolvedValue(
    rol ? { user: { id: 1, rol, nombre: "Prueba", email: "prueba@example.com" } } : null
  );
}

function formulario(nombre: string) {
  const datos = new FormData();
  datos.set("nombre", nombre);
  return datos;
}

beforeEach(() => vi.resetAllMocks());

describe("alta de categorías", () => {
  it.each(["VENDEDOR", "PENDIENTE", null] as const)("impide crear con sesión %s", async (rol) => {
    sesionDe(rol);
    const resultado = await crearCategoriaAction({}, formulario("Bebidas"));
    expect(resultado.mensaje).toBeDefined();
    expect(crearCategoria).not.toHaveBeenCalled();
  });

  it("valida el nombre y conserva lo ingresado", async () => {
    sesionDe("ADMIN");
    const resultado = await crearCategoriaAction({}, formulario("   "));
    expect(resultado.errores?.nombre).toEqual(["El nombre es obligatorio"]);
    expect(resultado.nombre).toBe("   ");
    expect(crearCategoria).not.toHaveBeenCalled();
  });

  it("informa un nombre duplicado", async () => {
    sesionDe("ADMIN");
    vi.mocked(crearCategoria).mockRejectedValue(new Prisma.PrismaClientKnownRequestError("duplicado", { code: "P2002", clientVersion: "test" }));
    const resultado = await crearCategoriaAction({}, formulario("Bebidas"));
    expect(resultado.mensaje).toBe("Ya existe un registro con ese valor.");
    expect(resultado.nombre).toBe("Bebidas");
  });

  it("crea la categoría activa y vuelve al listado", async () => {
    sesionDe("ADMIN");
    await crearCategoriaAction({}, formulario(" Bebidas "));
    expect(crearCategoria).toHaveBeenCalledWith({ nombre: "Bebidas", activa: true });
    expect(revalidatePath).toHaveBeenCalledWith("/categorias");
    expect(redirect).toHaveBeenCalledWith("/categorias");
  });
});
