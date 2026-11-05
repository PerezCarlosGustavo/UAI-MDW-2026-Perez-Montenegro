import { beforeEach, describe, expect, it, vi } from "vitest";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cambiarEstadoProductoAction, crearProductoAction, editarProductoAction } from "./acciones";
import { existeCategoria } from "@/lib/db/categorias";
import { actualizarProducto, crearProducto } from "@/lib/db/productos";

// La sesión es lo único que se simula de la autorización: verificarPermiso y
// la matriz de permisos corren de verdad.
vi.mock("next-auth", () => ({ getServerSession: vi.fn() }));
vi.mock("next-auth/providers/google", () => ({ default: vi.fn() }));
vi.mock("@/lib/db/client", () => ({ prisma: {} }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("@/lib/db/categorias", () => ({ existeCategoria: vi.fn() }));
vi.mock("@/lib/db/productos", () => ({ crearProducto: vi.fn(), actualizarProducto: vi.fn() }));

function sesionDe(rol: "ADMIN" | "VENDEDOR" | "PENDIENTE" | null) {
  vi.mocked(getServerSession).mockResolvedValue(
    rol ? { user: { id: 1, rol, nombre: "Prueba", email: "prueba@example.com" } } : null
  );
}

function formulario(campos: Record<string, string> = {}) {
  const formData = new FormData();
  const completos = { nombre: "Yerba", categoriaid: "2", preciolista: "2500", permitestock: "on", stockactual: "5", ...campos };
  for (const [campo, valor] of Object.entries(completos)) formData.set(campo, valor);
  return formData;
}

const SIN_PERMISO = { mensaje: "No tenés permiso para hacer esto." };

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(existeCategoria).mockResolvedValue(true);
});

describe("autorización de las acciones de productos", () => {
  it.each(["VENDEDOR", "PENDIENTE", null] as const)("con sesión %s no se puede crear", async (rol) => {
    sesionDe(rol);

    expect(await crearProductoAction({}, formulario())).toEqual(SIN_PERMISO);
    expect(crearProducto).not.toHaveBeenCalled();
  });

  it.each(["VENDEDOR", "PENDIENTE", null] as const)("con sesión %s no se puede editar", async (rol) => {
    sesionDe(rol);

    expect(await editarProductoAction(1, 5, {}, formulario())).toEqual(SIN_PERMISO);
    expect(actualizarProducto).not.toHaveBeenCalled();
  });

  it.each(["VENDEDOR", "PENDIENTE", null] as const)("con sesión %s no se puede dar de baja", async (rol) => {
    sesionDe(rol);

    expect(await cambiarEstadoProductoAction(1, false)).toEqual(SIN_PERMISO);
    expect(actualizarProducto).not.toHaveBeenCalled();
  });
});

describe("crearProductoAction", () => {
  beforeEach(() => sesionDe("ADMIN"));

  it("un dato mal formado va al campo y conserva lo escrito", async () => {
    const estado = await crearProductoAction({}, formulario({ nombre: "", preciolista: "abc" }));

    expect(estado.errores?.nombre).toEqual(["El nombre es obligatorio"]);
    expect(estado.errores?.preciolista).toEqual(["Ingresá un precio válido"]);
    expect(estado.valores?.preciolista).toBe("abc");
    expect(crearProducto).not.toHaveBeenCalled();
  });

  it("el rechazo de una regla va arriba, no en un campo, y conserva lo escrito", async () => {
    vi.mocked(existeCategoria).mockResolvedValue(false);

    const estado = await crearProductoAction({}, formulario({ nombre: "Yerba" }));

    expect(estado.mensaje).toBe("La categoría indicada no existe.");
    expect(estado.errores).toBeUndefined();
    expect(estado.valores?.nombre).toBe("Yerba");
  });

  it("al guardar refresca el catálogo y el punto de venta, y recién ahí redirige", async () => {
    vi.mocked(crearProducto).mockResolvedValue({ id: 1n } as never);

    await crearProductoAction({}, formulario());

    expect(revalidatePath).toHaveBeenCalledWith("/productos");
    expect(revalidatePath).toHaveBeenCalledWith("/ventas");
    expect(redirect).toHaveBeenCalledWith("/productos");
  });
});

describe("editarProductoAction", () => {
  beforeEach(() => sesionDe("ADMIN"));

  it("un id inválido no llega a la base", async () => {
    await editarProductoAction(-1, 0, {}, formulario());

    expect(actualizarProducto).not.toHaveBeenCalled();
  });

  it("si no se tocó el stock, no lo pisa", async () => {
    vi.mocked(actualizarProducto).mockResolvedValue({ id: 1n } as never);

    await editarProductoAction(1, 5, {}, formulario({ stockactual: "5" }));

    expect(vi.mocked(actualizarProducto).mock.calls[0]?.[1].stockactual).toBeUndefined();
  });
});


describe("stock mínimo en Server Actions", () => {
  beforeEach(() => sesionDe("ADMIN"));

  it("devuelve el error en su campo y conserva el mínimo inválido", async () => {
    const estado = await crearProductoAction({}, formulario({ stockminimo: "-2" }));
    expect(estado.errores?.stockminimo).toEqual(["El stock mínimo no puede ser negativo"]);
    expect(estado.valores?.stockminimo).toBe("-2");
    expect(crearProducto).not.toHaveBeenCalled();
  });

  it("guarda el mínimo al crear", async () => {
    vi.mocked(crearProducto).mockResolvedValue({ id: 1n } as never);
    await crearProductoAction({}, formulario({ stockminimo: "2.5" }));
    expect(crearProducto).toHaveBeenCalledWith(expect.objectContaining({ stockminimo: 2.5 }));
  });

  it("actualiza el mínimo sin sobrescribir descuentos de ventas concurrentes", async () => {
    vi.mocked(actualizarProducto).mockResolvedValue({ id: 1n } as never);
    await editarProductoAction(1, 5, {}, formulario({ stockminimo: "3" }));
    expect(actualizarProducto).toHaveBeenCalledWith(1n, expect.objectContaining({ stockminimo: 3, stockactual: undefined }));
  });
});
