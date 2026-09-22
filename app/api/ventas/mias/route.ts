import { requerirUsuario } from "@/app/api/auth/auth";
import { prisma } from "@/lib/db/client";
import { respuestaErrorAutorizacion } from "@/lib/auth/errores";

export async function GET() {
  let usuario;
  try {
    usuario = await requerirUsuario("VENDEDOR");
  } catch (error) {
    return respuestaErrorAutorizacion(error) ?? Response.json({ error: "Error interno" }, { status: 500 });
  }

  const ventas = await prisma.venta.findMany({
    where: { usuarioid: usuario.id },
    include: { detalleventa: true, cliente: true },
  });

  return Response.json(ventas);
}
