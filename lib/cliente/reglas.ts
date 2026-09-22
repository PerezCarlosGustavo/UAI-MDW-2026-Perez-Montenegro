import { prisma } from "@/lib/db/client";

export async function validarReglasCliente(data: any, id?: bigint) {
  const errores: string[] = [];

  // Documento único (si se envía)
  if (data.documento) {
    const existente = await prisma.cliente.findUnique({
      where: { documento: data.documento },
    });

    if (existente && existente.id !== id) {
      errores.push("El documento ya está registrado en otro cliente.");
    }
  }

  // Teléfono válido (si se envía)
  if (data.telefono) {
    if (data.telefono.length < 6) {
      errores.push("El teléfono es demasiado corto.");
    }
    if (!/^[0-9+\-() ]+$/.test(data.telefono)) {
      errores.push("El teléfono contiene caracteres inválidos.");
    }
  }

  // Cliente inactivo → no debería poder operar
  if (data.activo === false) {
    // Si el cliente tiene cuenta corriente, no puede desactivarse sin cerrar movimientos
    const cuenta = await prisma.cuentacorriente.findUnique({
      where: { clienteid: id },
    });

    if (cuenta) {
      const movimientos = await prisma.cuentacorrientemovimiento.findMany({
        where: { cuentacorrienteid: cuenta.id },
        take: 1,
      });

      if (movimientos.length > 0) {
        errores.push("No se puede desactivar un cliente con movimientos en cuenta corriente.");
      }
    }
  }

  if (errores.length > 0) {
    return { ok: false, errores };
  }

  return { ok: true };
}
