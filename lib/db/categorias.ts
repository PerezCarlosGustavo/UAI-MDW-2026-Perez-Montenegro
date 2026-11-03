import { prisma } from "@/lib/db/client";

// Son pocas, pero toda lista lleva límite (AGENTS.md).
const LIMITE_CATEGORIAS = 100;

export async function listarCategorias() {
  return prisma.categoria.findMany({ orderBy: { nombre: "asc" }, take: LIMITE_CATEGORIAS });
}

export async function existeCategoria(id: bigint) {
  return (await prisma.categoria.count({ where: { id } })) > 0;
}
