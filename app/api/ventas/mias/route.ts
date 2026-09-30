import { requerirUsuario } from "@/app/api/auth/auth";
import { prisma } from "@/lib/db/client";
import { responderJson } from "@/lib/utils";
import { responderError } from "@/lib/errores";

export async function GET() {
  try {
    const usuario = await requerirUsuario("VENDEDOR");

    const ventas = await prisma.venta.findMany({
      where: { usuarioid: usuario.id },
      include: { detalleventa: true, cliente: true },
    });

    return responderJson(ventas);
  } catch (error) {
    return responderError("GET /api/ventas/mias", error);
  }
}
