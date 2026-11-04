import { Prisma } from "@prisma/client";
import { ErrorAutorizacion } from "@/lib/auth/errores";

export function mensajeErrorAccion(contexto: string, error: unknown): string {
  if (error instanceof ErrorAutorizacion) return error.message;
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") return "Ya existe un registro con ese valor.";
    if (error.code === "P2025") return "Recurso inexistente.";
  }
  console.error(contexto, error);
  return "No se pudo completar la operación. Probá de nuevo.";
}
