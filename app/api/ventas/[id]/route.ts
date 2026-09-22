import { verificarPermiso } from "@/lib/auth/verificarPermiso";
import { prisma } from "@/lib/db/client";
import { respuestaErrorAutorizacion } from "@/lib/auth/errores";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await verificarPermiso("venta", "ver");
  } catch (error) {
    return respuestaErrorAutorizacion(error) ?? Response.json({ error: "Error interno" }, { status: 500 });
  }

  const { id } = await params;

  const venta = await prisma.venta.findUnique({
    where: { id: BigInt(id) },
    include: { detalleventa: true, cliente: true, usuario: true },
  });

  if (!venta) {
    return new Response("Venta no encontrada", { status: 404 });
  }

  return Response.json(venta);
}
