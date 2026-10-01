import { prisma } from "@/lib/db/client";
import type { ActualizarProductoInput, CrearProductoInput } from "@/lib/schemas/producto";

// Tope del catálogo que se manda al POS. Toda lista lleva límite (AGENTS.md).
const LIMITE_POR_DEFECTO = 200;

/** Productos activos, para vender. */
export async function listarProductosActivos(limite: number = LIMITE_POR_DEFECTO) {
  return prisma.producto.findMany({
    where: { activo: true },
    orderBy: { id: "asc" },
    take: limite,
  });
}

/** Un producto por id (activo o no). `null` → 404. */
export async function obtenerProducto(id: bigint) {
  return prisma.producto.findUnique({ where: { id } });
}

export async function crearProducto(datos: CrearProductoInput) {
  return prisma.producto.create({
    data: {
      nombre: datos.nombre,
      categoriaid: BigInt(datos.categoriaid),
      codigobarra: datos.codigobarra,
      preciolista: datos.preciolista,
      permitestock: datos.permitestock,
      stockactual: datos.stockactual,
      activo: datos.activo ?? true,
    },
  });
}

/** Si el id no existe, Prisma lanza P2025 y responderError lo pasa a 404. */
export async function actualizarProducto(id: bigint, datos: ActualizarProductoInput) {
  const { categoriaid, ...resto } = datos;

  return prisma.producto.update({
    where: { id },
    data: {
      ...resto,
      ...(categoriaid !== undefined ? { categoriaid: BigInt(categoriaid) } : {}),
    },
  });
}

/**
 * Baja lógica: activo = false. No se borra la fila porque hay ventas que la
 * referencian (detalleventa). Un producto inactivo no se puede vender.
 */
export async function desactivarProducto(id: bigint) {
  return prisma.producto.update({
    where: { id },
    data: { activo: false },
  });
}
