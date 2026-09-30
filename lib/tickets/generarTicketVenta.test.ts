import { describe, expect, it, vi } from "vitest";
import { promises as fs } from "node:fs";
import path from "node:path";
import { subirPdf } from "@/lib/servicios/storageService";
import { generarTicketVentaPdf } from "./generarTicketVenta";

vi.mock("@/lib/servicios/storageService", () => ({
  subirPdf: vi.fn().mockResolvedValue({}),
}));

describe("generarTicketVentaPdf", () => {
  it("devuelve un buffer PDF y lo guarda en disco cuando recibe destino", async () => {
    const dir = path.join(process.cwd(), "tmp", "test-tickets");
    const buffer = await generarTicketVentaPdf({
      ventaId: BigInt(123),
      productos: [
        { nombre: "Producto A", cantidad: 2, subtotal: 150 },
        { nombre: "Producto B", cantidad: 1, subtotal: 200 },
      ],
      total: 350,
      destino: dir,
    });

    try {
      expect(Buffer.isBuffer(buffer)).toBe(true);
      expect(buffer.length).toBeGreaterThan(0);
      expect(subirPdf).not.toHaveBeenCalled();

      const filePath = path.join(dir, "ticket-venta-123.pdf");
      const exists = await fs
        .access(filePath)
        .then(() => true)
        .catch(() => false);

      expect(exists).toBe(true);
      const stat = await fs.stat(filePath);
      expect(stat.size).toBeGreaterThan(0);
    } finally {
      await fs.rm(dir, { recursive: true, force: true });
    }
  });

  it("sube el PDF a storage cuando no recibe destino", async () => {
    const buffer = await generarTicketVentaPdf({
      ventaId: BigInt(123),
      productos: [{ nombre: "Producto A", cantidad: 2, subtotal: 150 }],
      total: 150,
    });

    expect(Buffer.isBuffer(buffer)).toBe(true);
    expect(subirPdf).toHaveBeenCalledWith({
      pdfBuffer: buffer,
      ventaId: "123",
    });
  });
});
