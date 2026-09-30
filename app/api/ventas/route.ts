import { verificarPermiso } from "@/lib/auth/verificarPermiso";
import { requerirUsuario } from "@/app/api/auth/auth";
import { prisma } from "@/lib/db/client";
import { responderJson } from "@/lib/utils";
import { validarVenta } from "@/lib/venta/validaciones";
import { validarReglasVenta } from "@/lib/venta/reglas";
import { responderError } from "@/lib/errores";
import { generarTicketVentaPdf } from "@/lib/tickets/generarTicketVenta";
import { crearVentaSchema } from "@/lib/schemas/venta";

export async function GET() {
  try {
    await verificarPermiso("venta", "ver");

    const ventas = await prisma.venta.findMany({
      include: { detalleventa: true, cliente: true, usuario: true },
    });

    return responderJson(ventas);
  } catch (error) {
    return responderError("GET /api/ventas", error);
  }
}

export async function POST(req: Request) {
  try {
    await verificarPermiso("venta", "crear");

    const usuario = await requerirUsuario(); // ADMIN o VENDEDOR

    const resultado = crearVentaSchema.safeParse(await req.json());
    if (!resultado.success) {
      return Response.json(
        { error: "Validación fallida", detalles: resultado.error.issues.map((issue) => issue.message) },
        { status: 400 }
      );
    }
    const data = resultado.data;

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
    console.log(data, usuario);

    // Crear venta
    const venta = await prisma.venta.create({
      data: {
        clienteid: data.clienteid ? BigInt(data.clienteid) : null,
        usuarioid: usuario.id,
        tipopago: data.tipopago,
        total: data.total,
        detalleventa: {
          create: data.detalles.map((d) => ({
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
  console.log("Venta creada con ID:", venta);
    const idsProductos = venta.detalleventa.map((detalle) => detalle.productoid);
    const productos = await prisma.producto.findMany({
      where: { id: { in: idsProductos } },
    });

    const nombresPorProducto = new Map(
      productos.map((producto) => [producto.id.toString(), producto.nombre])
    );

    const detalleTicket = venta.detalleventa.map((detalle) => ({
      nombre: nombresPorProducto.get(detalle.productoid.toString()) ?? "Producto",
      cantidad: Number(detalle.cantidad),
      subtotal: Number(detalle.subtotal),
    }));

    await generarTicketVentaPdf({
      ventaId: venta.id,
      productos: detalleTicket,
      total: Number(venta.total),
    });

    return responderJson(venta, 201);
  } catch (error) {
    return responderError("POST /api/ventas", error);
  }
}
