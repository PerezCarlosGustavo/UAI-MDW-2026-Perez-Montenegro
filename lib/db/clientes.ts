import { prisma } from "@/lib/db/client";
import type { ActualizarClienteInput, CrearClienteInput } from "@/lib/schemas/cliente";

const LIMITE_POR_DEFECTO = 200;

/** Clientes activos, ordenados por nombre para elegirlos en el POS. */
export async function listarClientesActivos(limite: number = LIMITE_POR_DEFECTO) {
  return prisma.cliente.findMany({
    where: { activo: true },
    orderBy: { nombre: "asc" },
    take: limite,
  });
}

/** Un cliente por id (activo o no). `null` → 404. */
export async function obtenerCliente(id: bigint) {
  return prisma.cliente.findUnique({ where: { id } });
}

export async function crearCliente(datos: CrearClienteInput) {
  return prisma.cliente.create({
    data: {
      nombre: datos.nombre,
      documento: datos.documento,
      telefono: datos.telefono,
      activo: datos.activo ?? true,
    },
  });
}

/** Si el id no existe, Prisma lanza P2025 y responderError lo pasa a 404. */
export async function actualizarCliente(id: bigint, datos: ActualizarClienteInput) {
  return prisma.cliente.update({ where: { id }, data: datos });
}

/**
 * Baja lógica: activo = false. No se borra porque tiene ventas y, si fió,
 * cuenta corriente. Un cliente inactivo no puede comprar.
 */
export async function desactivarCliente(id: bigint) {
  return prisma.cliente.update({ where: { id }, data: { activo: false } });
}
