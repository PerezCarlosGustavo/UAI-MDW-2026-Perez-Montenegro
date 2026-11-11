import { describe, expect, it } from "vitest";
import { responderPdf } from "./utils";

describe("responderPdf", () => {
  it("entrega el comprobante como archivo descargable", async () => {
    const pdf = Buffer.from("%PDF-prueba");
    const respuesta = responderPdf(pdf, "ticket-venta-12.pdf");

    expect(respuesta.headers.get("Content-Type")).toBe("application/pdf");
    expect(respuesta.headers.get("Content-Disposition")).toBe('attachment; filename="ticket-venta-12.pdf"');
    expect(respuesta.headers.get("Cache-Control")).toBe("private, no-store");
    expect(Buffer.from(await respuesta.arrayBuffer())).toEqual(pdf);
  });
});
