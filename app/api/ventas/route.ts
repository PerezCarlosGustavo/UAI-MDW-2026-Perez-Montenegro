import { verificarPermiso } from "@/lib/auth/verificarPermiso";
import { requerirUsuario } from "@/app/api/auth/auth";
import { prisma } from "@/lib/db/client";
import { validarVenta } from "@/lib/venta/validaciones";
import { validarReglasVenta } from "@/lib/venta/reglas";
import { respuestaErrorAutorizacion } from "@/lib/auth/errores";

export async function GET() {
  try {
    await verificarPermiso("venta", "ver");
  } catch (error) {
    return respuestaErrorAutorizacion(error) ?? Response.json({ error: "Error interno" }, { status: 500 });
  }

  const ventas = await prisma.venta.findMany({
    include: { detalleventa: true, cliente: true, usuario: true },
  });

  return Response.json(ventas);
}

export async function POST(req: Request) {
  try {
    await verificarPermiso("venta", "crear");
  } catch (error) {
    return respuestaErrorAutorizacion(error) ?? Response.json({ error: "Error interno" }, { status: 500 });
  }

  let usuario;
  try {
    usuario = await requerirUsuario(); // ADMIN o VENDEDOR
  } catch (error) {
    return respuestaErrorAutorizacion(error) ?? Response.json({ error: "Error interno" }, { status: 500 });
  }

  const data = await req.json();

  // Validaciones de forma
  const validacion = validarVenta(data);
  if (!validacion.ok) {
    return Response.json(
      { error: "Validación fallida", detalles: validacion.errores },
      { status: 400 }
    );
  }

  // Validaciones de negocio
  const reglas = await validarReglasVenta(data);
  if (!reglas.ok) {
    return Response.json(
      { error: "Reglas de negocio fallidas", detalles: reglas.errores },
      { status: 409 }
    );
  }

  // Crear venta
  const venta = await prisma.venta.create({
    data: {
      clienteid: data.clienteid ? BigInt(data.clienteid) : null,
      usuarioid: usuario.id,
      tipopago: data.tipopago,
      total: data.total,
      detalleventa: {
        create: data.detalles.map((d: any) => ({
          productoid: BigInt(d.productoid),
          cantidad: d.cantidad,
          preciounitario: d.preciounitario,
          subtotal: d.subtotal,
        })),
      },
    },
    include: { detalleventa: true },
  });

  // Actualizar stock
  for (const d of data.detalles) {
    await prisma.producto.update({
      where: { id: BigInt(d.productoid) },
      data: {
        stockactual: {
          decrement: d.cantidad,
        },
      },
    });
  }

  return Response.json(venta);
}
