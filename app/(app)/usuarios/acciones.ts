"use server";

import { revalidatePath } from "next/cache";
import { verificarPermiso } from "@/lib/auth/verificarPermiso";
import { mensajeErrorAccion } from "@/lib/acciones/errores";
import { actualizarUsuario } from "@/lib/db/usuarios";
import { actualizarUsuarioSchema, idUsuarioSchema } from "@/lib/schemas/usuario";
import { validarCambioDeUsuario } from "@/lib/usuario/reglas";

export async function actualizarUsuarioAction(id: unknown, entrada: unknown) {
  try {
    const admin = await verificarPermiso("usuario", "editar");

    const idValido = idUsuarioSchema.safeParse(id);
    const datos = actualizarUsuarioSchema.safeParse(entrada);

    if (!idValido.success) {
      return {
        ok: false as const,
        mensaje: "Usuario inválido.",
      };
    }

    if (!datos.success) {
      return {
        ok: false as const,
        mensaje: datos.error.issues.map((issue) => issue.message).join(" "),
      };
    }

    const reglas = validarCambioDeUsuario(idValido.data, admin.id, datos.data);

    if (!reglas.ok) {
      return {
        ok: false as const,
        mensaje: reglas.errores?.join(" ") ?? "Cambio no permitido.",
      };
    }

    await actualizarUsuario(BigInt(idValido.data), datos.data);
    revalidatePath("/usuarios");

    return { ok: true as const };
  } catch (error) {
    return {
      ok: false as const,
      mensaje: mensajeErrorAccion("actualizarUsuarioAction", error),
    };
  }
}
