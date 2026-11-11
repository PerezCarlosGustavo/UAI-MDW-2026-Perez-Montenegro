import { afterEach, describe, expect, it, vi } from "vitest";
import { obtenerComprobantePdf } from "./descargarComprobante";

afterEach(() => vi.unstubAllGlobals());

describe("descarga de comprobante", () => {
  it("acepta un PDF válido", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("%PDF-1.7\ncontenido", { headers: { "Content-Type": "application/pdf" } })));
    const pdf = await obtenerComprobantePdf("/api/ventas/1/comprobante");
    expect(await pdf.text()).toBe("%PDF-1.7\ncontenido");
  });

  it("no descarga la respuesta de un error 500", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ error: "Error interno" }, { status: 500 })));
    await expect(obtenerComprobantePdf("/api/ventas/1/comprobante")).rejects.toThrow("No se pudo generar el comprobante");
  });

  it.each([
    [401, "Tu sesión venció"],
    [403, "No tenés permiso"],
    [404, "No se encontró el comprobante"],
  ])("informa el error %i sin descargarlo", async (status, mensaje) => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("error", { status })));
    await expect(obtenerComprobantePdf("/api/ventas/1/comprobante")).rejects.toThrow(mensaje);
  });

  it("rechaza una página de inicio de sesión o un archivo de texto", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("iniciar sesión", { headers: { "Content-Type": "text/html" } })));
    await expect(obtenerComprobantePdf("/api/ventas/1/comprobante")).rejects.toThrow("no devolvió un comprobante PDF");
  });

  it("rechaza contenido que se declara PDF pero no lo es", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("error", { headers: { "Content-Type": "application/pdf" } })));
    await expect(obtenerComprobantePdf("/api/ventas/1/comprobante")).rejects.toThrow("no es un PDF válido");
  });
});
