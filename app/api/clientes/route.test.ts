import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";
import { verificarPermiso } from "@/lib/auth/verificarPermiso";
import { crearCliente } from "@/lib/db/clientes";
import { validarReglasCliente } from "@/lib/cliente/reglas";
import { ErrorAutorizacion } from "@/lib/auth/errores";

vi.mock("@/lib/auth/verificarPermiso", () => ({ verificarPermiso: vi.fn() }));
vi.mock("@/lib/db/clientes", () => ({ crearCliente: vi.fn(), listarClientes: vi.fn() }));
vi.mock("@/lib/cliente/reglas", () => ({ validarReglasCliente: vi.fn() }));

function pedido(datos: unknown) {
  return new Request("http://localhost/api/clientes", {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(datos),
  });
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(validarReglasCliente).mockResolvedValue({ ok: true, errores: [] });
});

describe("POST /api/clientes", () => {
  it("crea el cliente con los datos normalizados y devuelve 201", async () => {
    vi.mocked(crearCliente).mockResolvedValue({ id: 7n, nombre: "Ana", documento: null, telefono: null, activo: true });
    const respuesta = await POST(pedido({ nombre: " Ana ", documento: null, telefono: null }));
    expect(verificarPermiso).toHaveBeenCalledWith("cliente", "crear");
    expect(crearCliente).toHaveBeenCalledWith({ nombre: "Ana", documento: null, telefono: null, activo: true });
    expect(respuesta.status).toBe(201);
    expect(await respuesta.json()).toEqual({ id: 7, nombre: "Ana", documento: null, telefono: null, activo: true });
  });

  it.each([
    { nombre: "" }, { nombre: "Ana", documento: "" }, { nombre: "Ana", telefono: "123" },
  ])("rechaza datos inválidos sin crear el cliente: %j", async (datos) => {
    expect((await POST(pedido(datos))).status).toBe(400);
    expect(crearCliente).not.toHaveBeenCalled();
    expect(validarReglasCliente).not.toHaveBeenCalled();
  });

  it("devuelve el conflicto de documento sin crear el cliente", async () => {
    vi.mocked(validarReglasCliente).mockResolvedValue({ ok: false, errores: ["El documento ya existe"] });
    const respuesta = await POST(pedido({ nombre: "Ana", documento: "12345678" }));
    expect(respuesta.status).toBe(409);
    expect((await respuesta.json()).detalles).toEqual(["El documento ya existe"]);
    expect(crearCliente).not.toHaveBeenCalled();
  });

  it.each([401, 403] as const)("rechaza un acceso no autorizado con %i", async (estado) => {
    vi.mocked(verificarPermiso).mockRejectedValue(new ErrorAutorizacion(estado, "Sin permiso"));
    expect((await POST(pedido({ nombre: "Ana" }))).status).toBe(estado);
    expect(crearCliente).not.toHaveBeenCalled();
    expect(validarReglasCliente).not.toHaveBeenCalled();
  });
});
