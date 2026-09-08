import { prisma } from "@/lib/db/client";
import type { CrearProductoInput } from "@/lib/schemas/producto";

const LIMITE_POR_DEFECTO = 50;

export async function listarProductos(limite: number = LIMITE_POR_DEFECTO) {
  return prisma.producto.findMany({
    take: limite,
    select: {
        id: true,
        categoriaid: true,
        nombre: true,
        codigobarra: true,
        preciolista: true,
        permitestock: true,
        stockactual: true,
        activo: true,
    },
  });
}
