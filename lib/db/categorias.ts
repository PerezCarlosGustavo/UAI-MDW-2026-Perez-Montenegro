import { prisma } from "@/lib/db/client";
import type { CrearCategoriaInput } from "@/lib/schemas/categoria";

export async function crearCategoria(datos: CrearCategoriaInput) {
  return prisma.categoria.create({ data: datos });
}

const LIMITE_CATEGORIAS = 10;

export async function listarCategorias() {
  return prisma.categoria.findMany({ orderBy: { nombre: "asc" }, take: LIMITE_CATEGORIAS });
}

export async function listarCategoriasPaginadas(pagina: number) {
  const [categorias, total] = await Promise.all([
    prisma.categoria.findMany({ orderBy: { nombre: "asc" }, skip: (pagina - 1) * LIMITE_CATEGORIAS, take: LIMITE_CATEGORIAS }),
    prisma.categoria.count(),
  ]);
  return { categorias, total, totalPaginas: Math.ceil(total / LIMITE_CATEGORIAS) };
}

export async function existeCategoria(id: bigint) {
  return (await prisma.categoria.count({ where: { id } })) > 0;
}
