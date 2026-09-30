import type { ActualizarUsuarioInput } from "@/lib/schemas/usuario";

/**
 * Un ADMIN no puede cambiarse su propio rol ni desactivarse.
 *
 * Si pudiera, el único ADMIN se podía sacar el rol sin querer y nadie más
 * podría aprobar usuarios (habría que entrar a la base a mano). Que otro
 * ADMIN lo haga sí está permitido.
 *
 * Función pura: no consulta la base, recibe los dos ids y lo que se quiere
 * cambiar.
 */
export function validarCambioDeUsuario(
  idUsuarioModificado: number,
  idAdminQueModifica: number,
  datos: ActualizarUsuarioInput
) {
  const errores: string[] = [];

  if (idUsuarioModificado === idAdminQueModifica) {
    if (datos.rol !== undefined && datos.rol !== "ADMIN") {
      errores.push("No podés quitarte el rol de ADMIN a vos mismo.");
    }

    if (datos.activo === false) {
      errores.push("No podés desactivar tu propio usuario.");
    }
  }

  if (errores.length > 0) {
    return { ok: false, errores };
  }

  return { ok: true };
}
