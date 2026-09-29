import { describe, expect, it, vi } from "vitest";
import { promises as fs } from "node:fs";
import path from "node:path";
import { subirTicketVentaSupabase } from "@/lib/services/supabaseBucket";
import { generarTicketVentaPdf } from "./generarTicketVenta";

vi.mock("@/lib/services/supabaseBucket", () => ({
  subirTicketVentaSupabase: vi.fn().mockResolvedValue({}),
}));

describe("generarTicketVentaPdf", () => {
  it("devuelve un buffer PDF y opcionalmente lo guarda en disco", async () => {
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

    expect(Buffer.isBuffer(buffer)).toBe(true);
    expect(buffer.length).toBeGreaterThan(0);
    expect(subirTicketVentaSupabase).toHaveBeenCalledWith({
      pdfBuffer: buffer,
      ventaId: "123",
    });

    const filePath = path.join(dir, "ticket-venta-123.pdf");
    const exists = await fs
      .access(filePath)
      .then(() => true)
      .catch(() => false);

    expect(exists).toBe(true);
    const stat = await fs.stat(filePath);
    expect(stat.size).toBeGreaterThan(0);
  });
});
