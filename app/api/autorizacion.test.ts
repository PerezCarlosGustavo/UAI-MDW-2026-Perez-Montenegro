import { beforeEach, describe, expect, it, vi } from "vitest";
import { getServerSession } from "next-auth";
import { POST as cobrar } from "./cobranza/route";
import { GET as verCuenta } from "./cuentacorriente/[id]/route";
import { POST as crearProducto } from "./productos/route";
import { DELETE as borrarProducto } from "./productos/[id]/route";
import { GET as listarUsuarios } from "./usuarios/route";
import { PATCH as cambiarRol } from "./usuarios/[id]/route";
import { GET as verVenta } from "./ventas/[id]/route";
import { prisma } from "@/lib/db/client";

// Se simulan la sesión y la base. Lo que corre de verdad es lo que se quiere
// probar: el handler, verificarPermiso, la matriz de permisos y el filtro de
// pertenencia. Si a un endpoint le borran el verificarPermiso, esto falla.
vi.mock("next-auth", () => ({ getServerSession: vi.fn() }));
vi.mock("next-auth/providers/google", () => ({ default: vi.fn() }));
vi.mock("@/lib/db/client", () => ({
  prisma: {
    usuario: { findMany: vi.fn(), update: vi.fn(), findUnique: vi.fn(), count: vi.fn() },
    venta: { findFirst: vi.fn() },
    producto: { create: vi.fn(), update: vi.fn() },
    cliente: { findUnique: vi.fn() },
    categoria: { findUnique: vi.fn() },
    $transaction: vi.fn(),
  },
}));

type Rol = "ADMIN" | "VENDEDOR" | "PENDIENTE";

function sesionDe(rol: Rol | null, id = 7) {
  vi.mocked(getServerSession).mockResolvedValue(
    rol ? { user: { id, rol, nombre: "Prueba", email: "prueba@example.com" } } : null
  );
}

const url = "http://localhost/api";
const conId = (id: string) => ({ params: Promise.resolve({ id }) });
const conCuerpo = (cuerpo: unknown) =>
  new Request(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(cuerpo) });

const productoValido = { nombre: "Yerba", categoriaid: 1, preciolista: 100 };

// Cada fila: qué endpoint, y qué rol no puede usarlo.
const endpointsRestringidos: [string, Rol, () => Promise<Response>][] = [
  ["GET /api/usuarios", "VENDEDOR", () => listarUsuarios(new Request(url))],
  ["GET /api/usuarios", "PENDIENTE", () => listarUsuarios(new Request(url))],
  ["PATCH /api/usuarios/:id", "VENDEDOR", () => cambiarRol(conCuerpo({ rol: "ADMIN" }), conId("2"))],
  ["PATCH /api/usuarios/:id", "PENDIENTE", () => cambiarRol(conCuerpo({ rol: "ADMIN" }), conId("2"))],
  ["POST /api/productos", "VENDEDOR", () => crearProducto(conCuerpo(productoValido))],
  ["POST /api/productos", "PENDIENTE", () => crearProducto(conCuerpo(productoValido))],
  ["DELETE /api/productos/:id", "VENDEDOR", () => borrarProducto(new Request(url), conId("1"))],
  ["POST /api/cobranza", "PENDIENTE", () => cobrar(conCuerpo({ clienteid: 1, monto: 100 }))],
  ["GET /api/cuentacorriente/:id", "PENDIENTE", () => verCuenta(new Request(url), conId("1"))],
  ["GET /api/ventas/:id", "PENDIENTE", () => verVenta(new Request(url), conId("1"))],
];

beforeEach(() => {
  vi.clearAllMocks();
});

describe("autorización en los endpoints", () => {
  it.each(endpointsRestringidos)("%s con rol %s responde 403 y no toca la base", async (_nombre, rol, llamar) => {
    sesionDe(rol);

    const respuesta = await llamar();

    expect(respuesta.status).toBe(403);
    expect(prisma.usuario.update).not.toHaveBeenCalled();
    expect(prisma.producto.create).not.toHaveBeenCalled();
    expect(prisma.producto.update).not.toHaveBeenCalled();
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it.each(endpointsRestringidos)("%s sin sesión responde 401 (fila de %s)", async (_nombre, _rol, llamar) => {
    sesionDe(null);

    expect((await llamar()).status).toBe(401);
  });
});

describe("pertenencia de las ventas", () => {
  it("la venta de otro vendedor responde 404, igual que si no existiera", async () => {
    sesionDe("VENDEDOR", 7);
    vi.mocked(prisma.venta.findFirst).mockResolvedValue(null);

    const respuesta = await verVenta(new Request(url), conId("99"));

    expect(respuesta.status).toBe(404);
    // El id de la sesión tiene que ir adentro de la consulta.
    expect(vi.mocked(prisma.venta.findFirst).mock.calls[0]?.[0]?.where).toEqual({ id: 99n, usuarioid: 7n });
  });

  it("el ADMIN busca la venta sin filtrar por usuario", async () => {
    sesionDe("ADMIN", 1);
    vi.mocked(prisma.venta.findFirst).mockResolvedValue(null);

    await verVenta(new Request(url), conId("99"));

    expect(vi.mocked(prisma.venta.findFirst).mock.calls[0]?.[0]?.where).toEqual({ id: 99n });
  });
});
