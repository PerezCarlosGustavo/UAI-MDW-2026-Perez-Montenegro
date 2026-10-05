import { verificarPermiso } from "@/lib/auth/verificarPermiso";
import { listarUsuarios } from "@/lib/db/usuarios";
import { filtroUsuariosSchema } from "@/lib/schemas/usuario";
import { responderJson } from "@/lib/utils";
import { responderError } from "@/lib/errores";

// GET /api/usuarios?rol=PENDIENTE → la lista de usuarios para el ABM.
export async function GET(req: Request) {
  try {
    await verificarPermiso("usuario", "ver");

    const query = Object.fromEntries(new URL(req.url).searchParams);
    const resultado = filtroUsuariosSchema.safeParse(query);
    if (!resultado.success) {
      return Response.json(
        { error: "Validación fallida", detalles: resultado.error.issues.map((issue) => issue.message) },
        { status: 400 }
      );
    }

    const usuarios = await listarUsuarios(resultado.data);

    return responderJson(usuarios);
  } catch (error) {
    return responderError("GET /api/usuarios", error);
  }
}
