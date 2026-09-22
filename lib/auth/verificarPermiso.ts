import { PERMISOS } from "./permisos";
import { requerirUsuario } from "@/app/api/auth/auth";
import { ErrorAutorizacion } from "./errores";

export async function verificarPermiso(
  recurso: keyof typeof PERMISOS,
  accion: keyof (typeof PERMISOS)[typeof recurso]
) {
  const usuario = await requerirUsuario();

  const permitidos = PERMISOS[recurso][accion];

  if (!permitidos.includes(usuario.rol)) {
    throw new ErrorAutorizacion(403, "No tiene permisos para esta operación");
  }

  return usuario;
}
