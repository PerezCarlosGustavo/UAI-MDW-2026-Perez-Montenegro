import { prisma } from "@/lib/db/client";

export async function validarReglasVenta(data: any) {
  const errores: string[] = [];

  // Cliente opcional, pero si viene debe existir
  if (data.clienteid) {
    const cliente = await prisma.cliente.findUnique({
      where: { id: BigInt(data.clienteid) },
    });

    if (!cliente) errores.push("El cliente no existe.");
    if (cliente && cliente.activo === false) errores.push("El cliente está inactivo.");
  }

  // Validar detalles
  for (const d of data.detalles) {
    const producto = await prisma.producto.findUnique({
      where: { id: BigInt(d.productoid) },
    });

    if (!producto) {
      errores.push(`El producto ${d.productoid} no existe.`);
      continue;
    }

    if (!producto.activo) {
      errores.push(`El producto ${producto.nombre} está inactivo.`);
    }

    // Validar stock si aplica
    if (producto.permitestock) {
      if (producto.stockactual < d.cantidad) {
        errores.push(
          `Stock insuficiente para ${producto.nombre}. Disponible: ${producto.stockactual}, solicitado: ${d.cantidad}.`
        );
      }
    }

    // Validar subtotal coherente
    const subtotalCalculado = Number(d.cantidad) * Number(d.preciounitario);
    if (Number(d.subtotal) !== subtotalCalculado) {
      errores.push(
        `Subtotal incorrecto para ${producto.nombre}. Debe ser ${subtotalCalculado}.`
      );
    }
  }

  // Validar total coherente
  const totalCalculado = data.detalles.reduce(
    (acc: number, d: any) => acc + Number(d.subtotal),
    0
  );

  if (Number(data.total) !== totalCalculado) {
    errores.push(`El total de la venta es incorrecto. Debe ser ${totalCalculado}.`);
  }

  if (errores.length > 0) {
    return { ok: false, errores };
  }

  return { ok: true };
}
