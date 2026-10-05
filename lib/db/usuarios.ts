import type { Rol } from "@prisma/client";
import { prisma } from "@/lib/db/client";
import type { ActualizarUsuarioInput } from "@/lib/schemas/usuario";

const LIMITE_POR_DEFECTO = 50;

// Lo que se muestra de un usuario en el ABM. Escrito una sola vez para que la
// lista y la modificación devuelvan lo mismo.
const CAMPOS_USUARIO = {
  id: true,
  nombre: true,
  email: true,
  rol: true,
  activo: true,
} as const;

/** Usuarios del sistema, opcionalmente filtrados por rol (ej. los PENDIENTE). */
export async function listarUsuarios(
  filtro: { rol?: Rol } = {},
  limite: number = LIMITE_POR_DEFECTO
) {
  return prisma.usuario.findMany({
    where: { rol: filtro.rol },
    take: limite,
    // Los más nuevos primero: son los que suelen estar esperando aprobación.
    orderBy: { id: "desc" },
    select: CAMPOS_USUARIO,
  });
}

/**
 * Cambia el rol o el estado de un usuario.
 *
 * Si el id no existe, Prisma lanza P2025 y responderError lo traduce a 404.
 * Como el rol se lee de la base en cada request (ADR 0007), el cambio se
 * aplica en el próximo request del usuario, sin que tenga que volver a entrar.
 */
export async function actualizarUsuario(id: bigint, datos: ActualizarUsuarioInput) {
  return prisma.usuario.update({
    where: { id },
    data: datos,
    select: CAMPOS_USUARIO,
  });
}
