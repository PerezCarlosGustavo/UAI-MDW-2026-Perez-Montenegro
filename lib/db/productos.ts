import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/client";
import type { ActualizarProductoInput, CrearProductoInput } from "@/lib/schemas/producto";

// Tope de GET /api/productos. Toda lista lleva límite (AGENTS.md).
const LIMITE_POR_DEFECTO = 200;
const LIMITE_BUSQUEDA = 20;
const PRODUCTOS_POR_PAGINA = 50;

/** Productos activos, para vender. */
export async function listarProductosActivos(limite: number = LIMITE_POR_DEFECTO) {
  return prisma.producto.findMany({
    where: { activo: true },
    orderBy: { id: "asc" },
    take: limite,
  });
}

// El catálogo real tiene miles de productos: las pantallas los buscan, nunca
// los traen todos.
function coincidenCon(q: string): Prisma.productoWhereInput {
  return {
    OR: [
      { nombre: { contains: q, mode: "insensitive" } },
      { codigobarra: { startsWith: q } },
    ],
  };
}

/** Para el buscador del punto de venta: solo lo que se puede vender. */
export async function buscarProductosParaVender(q: string, limite: number = LIMITE_BUSQUEDA) {
  return prisma.producto.findMany({
    where: { activo: true, ...coincidenCon(q) },
    orderBy: { nombre: "asc" },
    take: limite,
  });
}

export async function hayProductosParaVender() {
  return (await prisma.producto.count({ where: { activo: true } })) > 0;
}

/** Una página del catálogo. Las bajas solo las ve quien las puede revertir. */
export async function listarCatalogo(opciones: { q?: string; pagina: number; incluirBajas: boolean }) {
  const where: Prisma.productoWhereInput = {
    ...(opciones.incluirBajas ? {} : { activo: true }),
    ...(opciones.q ? coincidenCon(opciones.q) : {}),
  };

  const [productos, total] = await Promise.all([
    prisma.producto.findMany({
      where,
      include: { categoria: { select: { nombre: true } } },
      orderBy: { nombre: "asc" },
      skip: (opciones.pagina - 1) * PRODUCTOS_POR_PAGINA,
      take: PRODUCTOS_POR_PAGINA,
    }),
    prisma.producto.count({ where }),
  ]);

  return { productos, total, totalPaginas: Math.ceil(total / PRODUCTOS_POR_PAGINA) };
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
