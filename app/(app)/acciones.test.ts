import { beforeEach, describe, expect, it, vi } from "vitest";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { crearClienteAction, registrarCobranzaAction } from "./clientes/acciones";
import { registrarVentaAction } from "./ventas/acciones";
import { actualizarUsuarioAction } from "./usuarios/acciones";

const db = vi.hoisted(() => ({
  crearCliente: vi.fn(), validarReglasCliente: vi.fn(), registrarCobranza: vi.fn(),
  buscarClienteParaVenta: vi.fn(), buscarProductosParaVenta: vi.fn(), registrarVenta: vi.fn(),
  actualizarUsuario: vi.fn(), generarTicketVentaPdf: vi.fn(),
}));

vi.mock("next-auth", () => ({ getServerSession: vi.fn() }));
vi.mock("next-auth/providers/google", () => ({ default: vi.fn() }));
vi.mock("@/lib/db/client", () => ({ prisma: {} }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/db/clientes", () => ({ crearCliente: db.crearCliente }));
vi.mock("@/lib/cliente/reglas", () => ({ validarReglasCliente: db.validarReglasCliente }));
vi.mock("@/lib/db/cuentacorriente", () => ({ registrarCobranza: db.registrarCobranza }));
vi.mock("@/lib/db/ventas", () => ({
  buscarClienteParaVenta: db.buscarClienteParaVenta,
  buscarProductosParaVenta: db.buscarProductosParaVenta,
  registrarVenta: db.registrarVenta
}));
vi.mock("@/lib/db/usuarios", () => ({ actualizarUsuario: db.actualizarUsuario }));
vi.mock("@/lib/tickets/generarTicketVenta", () => ({ generarTicketVentaPdf: db.generarTicketVentaPdf }));

function sesion(rol: "ADMIN" | "VENDEDOR" | "PENDIENTE" | null) {
  vi.mocked(getServerSession).mockResolvedValue(rol ? { user: { id: 1, rol, nombre: "Operador", email: "operador@example.com" } } : null);
}

const venta = { tipopago: 0, detalles: [{ productoid: 2, cantidad: 1 }] };
const acciones = [
  ["alta de cliente", () => crearClienteAction({ nombre: "Ana" })],
  ["cobranza", () => registrarCobranzaAction({ clienteid: 7, monto: 100 })],
  ["venta", () => registrarVentaAction(venta)],
  ["usuario", () => actualizarUsuarioAction(7, { rol: "VENDEDOR" })],
] as const;

beforeEach(() => {
  vi.resetAllMocks();
  sesion("ADMIN");
  db.validarReglasCliente.mockResolvedValue({ ok: true });
});

describe("autorización de Server Actions", () => {
  it.each(acciones)("%s requiere sesión y aprobación", async (_nombre, ejecutar) => {
    for (const rol of [null, "PENDIENTE"] as const) {
      sesion(rol);
      expect((await ejecutar()).ok).toBe(false);
    }
    expect(db.crearCliente).not.toHaveBeenCalled();
    expect(db.registrarCobranza).not.toHaveBeenCalled();
    expect(db.registrarVenta).not.toHaveBeenCalled();
    expect(db.actualizarUsuario).not.toHaveBeenCalled();
  });

  it("un vendedor no puede administrar usuarios", async () => {
    sesion("VENDEDOR");
    expect((await actualizarUsuarioAction(7, { rol: "ADMIN" })).ok).toBe(false);
    expect(db.actualizarUsuario).not.toHaveBeenCalled();
  });
});

describe("alta de cliente por Server Action", () => {
  it("valida en el servidor aunque se invoque sin el formulario", async () => {
    const respuesta = await crearClienteAction({ nombre: "" });
    expect(respuesta.ok).toBe(false);
    expect(respuesta).toHaveProperty("errores.nombre");
    expect(db.crearCliente).not.toHaveBeenCalled();
  });

  it("normaliza los datos, devuelve el cliente y actualiza las pantallas", async () => {
    db.crearCliente.mockResolvedValue({ id: 7n, nombre: "Ana" });
    expect(await crearClienteAction({ nombre: " Ana " })).toEqual({ ok: true, cliente: { id: 7, nombre: "Ana" } });
    expect(db.crearCliente).toHaveBeenCalledWith({ nombre: "Ana", activo: true });
    expect(revalidatePath).toHaveBeenCalledWith("/clientes");
    expect(revalidatePath).toHaveBeenCalledWith("/ventas");
  });

  it("devuelve el conflicto de documento sin escribir", async () => {
    db.validarReglasCliente.mockResolvedValue({ ok: false, errores: ["Documento repetido"] });
    expect(await crearClienteAction({ nombre: "Ana" })).toEqual({ ok: false, mensaje: "Documento repetido" });
    expect(db.crearCliente).not.toHaveBeenCalled();
  });
});

describe("cobranza por Server Action", () => {
  it("rechaza montos inválidos antes de escribir", async () => {
    expect((await registrarCobranzaAction({ clienteid: 7, monto: -1 })).ok).toBe(false);
    expect(db.registrarCobranza).not.toHaveBeenCalled();
  });

  it("informa un cliente inexistente", async () => {
    db.registrarCobranza.mockResolvedValue(null);
    expect(await registrarCobranzaAction({ clienteid: 7, monto: 100 })).toEqual({ ok: false, mensaje: "Cliente no encontrado." });
  });

  it("devuelve el resultado de FIFO y actualiza clientes", async () => {
    const cobranza = { pagados: [], saldoAFavor: 100 };
    db.registrarCobranza.mockResolvedValue(cobranza);
    expect(await registrarCobranzaAction({ clienteid: 7, monto: 100 })).toEqual({ ok: true, cobranza });
    expect(db.registrarCobranza).toHaveBeenCalledWith(7, 100);
    expect(revalidatePath).toHaveBeenCalledWith("/clientes");
  });
});

describe("usuarios por Server Action", () => {
  it("valida identificadores y roles", async () => {
    expect((await actualizarUsuarioAction(-1, { rol: "ADMIN" })).ok).toBe(false);
    expect((await actualizarUsuarioAction(7, { rol: "otro" })).ok).toBe(false);
    expect(db.actualizarUsuario).not.toHaveBeenCalled();
  });

  it("impide que un administrador se quite su propio acceso", async () => {
    expect((await actualizarUsuarioAction(1, { rol: "VENDEDOR", activo: false })).ok).toBe(false);
    expect(db.actualizarUsuario).not.toHaveBeenCalled();
  });

  it("actualiza otro usuario y refresca la lista", async () => {
    expect(await actualizarUsuarioAction(7, { rol: "VENDEDOR" })).toEqual({ ok: true });
    expect(db.actualizarUsuario).toHaveBeenCalledWith(7n, { rol: "VENDEDOR" });
    expect(revalidatePath).toHaveBeenCalledWith("/usuarios");
  });
});

describe("ventas por Server Action", () => {
  it("rechaza una venta vacía", async () => {
    expect((await registrarVentaAction({ tipopago: 0, detalles: [] })).ok).toBe(false);
    expect(db.registrarVenta).not.toHaveBeenCalled();
  });

  it("rechaza productos inexistentes", async () => {
    db.buscarProductosParaVenta.mockResolvedValue([]);
    expect((await registrarVentaAction(venta)).ok).toBe(false);
    expect(db.registrarVenta).not.toHaveBeenCalled();
  });

  it("usa la sesión y el precio del catálogo, ignorando los enviados por el cliente", async () => {
    db.buscarProductosParaVenta.mockResolvedValue([{ id: 2, nombre: "Yerba", preciolista: 100, permitestock: true, stockactual: 10, activo: true }]);
    db.registrarVenta.mockResolvedValue({ id: 9n, total: 100, detalleventa: [] });
    const respuesta = await registrarVentaAction({ ...venta, usuarioid: 999, total: 1 });
    expect(respuesta).toEqual({ ok: true, ventaId: 9, advertencias: [] });
    expect(db.registrarVenta).toHaveBeenCalledWith(expect.objectContaining({ usuarioid: 1, total: 100 }));
    expect(db.generarTicketVentaPdf).toHaveBeenCalledOnce();
  });

  it("si falla el PDF informa que la venta se registró para evitar reintentos duplicados", async () => {
    db.buscarProductosParaVenta.mockResolvedValue([{ id: 2, nombre: "Yerba", preciolista: 100, permitestock: false, stockactual: 0, activo: true }]);
    db.registrarVenta.mockResolvedValue({ id: 9n, total: 100, detalleventa: [] });
    db.generarTicketVentaPdf.mockRejectedValue(new Error("PDF no disponible"));
    const log = vi.spyOn(console, "error").mockImplementation(() => { });
    try {
      const respuesta = await registrarVentaAction(venta);
      expect(respuesta.ok).toBe(true);
      expect(respuesta).toHaveProperty("advertencias", ["La venta se registró, pero no se pudo generar el comprobante."]);
      expect(db.registrarVenta).toHaveBeenCalledOnce();
    } finally { log.mockRestore(); }
  });
});
