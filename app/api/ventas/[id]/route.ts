import { verificarPermiso } from "@/lib/auth/verificarPermiso";
import { prisma } from "@/lib/db/client";
import { responderJson } from "@/lib/utils";
import { responderError } from "@/lib/errores";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await verificarPermiso("venta", "ver");

    const { id } = await params;

    const venta = await prisma.venta.findUnique({
      where: { id: BigInt(id) },
      include: { detalleventa: true, cliente: true, usuario: true },
    });

    if (!venta) {
      return Response.json({ error: "Venta no encontrada" }, { status: 404 });
    }

    return responderJson(venta);
  } catch (error) {
    return responderError("GET /api/ventas/:id", error);
  }
}
