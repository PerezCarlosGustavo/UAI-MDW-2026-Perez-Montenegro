import type { Prisma, Rol } from "@prisma/client";

/**
 * Qué ventas puede ver cada rol. Es el WHERE de la clase 6: el id de la
 * sesión va ADENTRO de la consulta, no en un `if` después.
 *
 * - ADMIN ve todas.
 * - VENDEDOR ve solo las que registró él. Una venta ajena no matchea y para
 *   él "no existe" (404), igual que en docs/permisos.md.
 */
export function filtroVentasVisiblesPara(usuario: {
  id: number;
  rol: Rol;
}): Prisma.ventaWhereInput {
  if (usuario.rol === "ADMIN") return {};

  return { usuarioid: BigInt(usuario.id) };
}
