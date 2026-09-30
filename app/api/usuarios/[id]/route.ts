import { verificarPermiso } from "@/lib/auth/verificarPermiso";
import { actualizarUsuario } from "@/lib/db/usuarios";
import { actualizarUsuarioSchema } from "@/lib/schemas/usuario";
import { validarCambioDeUsuario } from "@/lib/usuario/reglas";
import { responderJson } from "@/lib/utils";
import { responderError } from "@/lib/errores";

// PATCH /api/usuarios/:id → aprobar (asignar rol) o desactivar a alguien.
// PATCH y no PUT porque se cambia una parte del usuario, no el recurso entero.
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    // El admin sale de la sesión: nunca se confía en un id o un rol del body.
    const admin = await verificarPermiso("usuario", "editar");

    const { id } = await params;
    const resultado = actualizarUsuarioSchema.safeParse(await req.json());
    if (!resultado.success) {
      return Response.json(
        { error: "Validación fallida", detalles: resultado.error.issues.map((issue) => issue.message) },
        { status: 400 }
      );
    }
    const datos = resultado.data;
    const idUsuario = BigInt(id);

    const reglas = validarCambioDeUsuario(Number(idUsuario), admin.id, datos);
    if (!reglas.ok) {
      return Response.json(
        { error: "Reglas de negocio fallidas", detalles: reglas.errores },
        { status: 409 }
      );
    }

    const usuario = await actualizarUsuario(idUsuario, datos);

    return responderJson(usuario);
  } catch (error) {
    return responderError("PATCH /api/usuarios/:id", error);
  }
}
