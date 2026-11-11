import { beforeEach, describe, expect, it, vi } from "vitest";
import { verificarPermiso } from "@/lib/auth/verificarPermiso";
import { obtenerVentaVisiblePara } from "@/lib/db/ventas";
import { obtenerComprobanteCobro } from "@/lib/db/cuentacorriente";
import { GET as descargarVenta } from "./ventas/[id]/comprobante/route";
import { GET as descargarCobro } from "./cobranza/[id]/comprobante/route";

vi.mock("@/lib/auth/verificarPermiso", () => ({ verificarPermiso: vi.fn() }));
vi.mock("@/lib/db/client", () => ({ prisma: {} }));
vi.mock("@/lib/db/ventas", () => ({ obtenerVentaVisiblePara: vi.fn() }));
vi.mock("@/lib/db/cuentacorriente", () => ({ obtenerComprobanteCobro: vi.fn() }));

const request = new Request("http://localhost/comprobante");
const params = { params: Promise.resolve({ id: "1" }) };

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(verificarPermiso).mockResolvedValue({ id: 1, rol: "ADMIN", nombre: "Prueba", email: "test@example.com" });
});

describe("descarga de comprobantes", () => {
  it("entrega el PDF generado de una venta visible", async () => {
    vi.mocked(obtenerVentaVisiblePara).mockResolvedValue({
      id: 1n, fecha: new Date("2026-11-11T12:00:00Z"), tipopago: 0, total: 100,
      cliente: null, usuario: { id: 1n, nombre: "Prueba" },
      detalleventa: [{ productoid: 1n, cantidad: 1, preciounitario: 100, subtotal: 100, producto: { nombre: "Yerba" } }],
    } as never);
    const respuesta = await descargarVenta(request, params);
    expect(respuesta.status).toBe(200);
    expect(respuesta.headers.get("content-type")).toBe("application/pdf");
    expect(respuesta.headers.get("content-disposition")).toBe('attachment; filename="ticket-venta-1.pdf"');
    expect(Buffer.from(await respuesta.arrayBuffer()).subarray(0, 5).toString()).toBe("%PDF-");
    expect(obtenerVentaVisiblePara).toHaveBeenCalledWith(1n, expect.objectContaining({ id: 1, rol: "ADMIN" }));
  });

  it("entrega el PDF generado de un cobro", async () => {
    vi.mocked(obtenerComprobanteCobro).mockResolvedValue({
      cobranzaid: 1, cliente: "Cliente", fecha: new Date("2026-11-11T12:00:00Z"),
      montoRecibido: 100, liquidados: [], saldoAFavorUsado: 0, saldoAFavorGenerado: 100, saldoAFavor: 100,
    } as never);
    const respuesta = await descargarCobro(request, params);
    expect(respuesta.status).toBe(200);
    expect(respuesta.headers.get("content-type")).toBe("application/pdf");
    expect(respuesta.headers.get("content-disposition")).toBe('attachment; filename="comprobante-cobro-1.pdf"');
    expect(Buffer.from(await respuesta.arrayBuffer()).subarray(0, 5).toString()).toBe("%PDF-");
  });
});
