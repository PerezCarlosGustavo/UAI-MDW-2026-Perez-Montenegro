import type { Rol } from "@prisma/client";
import { PERMISOS } from "./permisos";
import { requerirUsuario } from "@/lib/auth";
import { ErrorAutorizacion } from "./errores";

type Recurso = keyof typeof PERMISOS;

// Genérico para que la acción dependa del recurso: verificarPermiso("venta",
// "editar") no compila, porque las ventas no se editan.
export async function verificarPermiso<R extends Recurso>(
  recurso: R,
  accion: keyof (typeof PERMISOS)[R]
) {
  const usuario = await requerirUsuario();

  const permitidos: Rol[] = PERMISOS[recurso][accion] as Rol[];

  if (!permitidos.includes(usuario.rol)) {
    throw new ErrorAutorizacion(403, "No tiene permisos para esta operación");
  }

  return usuario;
}
