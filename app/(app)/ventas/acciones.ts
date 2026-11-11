"use server";

import { revalidatePath } from "next/cache";
import { verificarPermiso } from "@/lib/auth/verificarPermiso";
import { mensajeErrorAccion } from "@/lib/acciones/errores";
import { crearVentaSchema } from "@/lib/schemas/venta";
import { registrarVenta } from "@/lib/casos/registrarVenta";

export async function registrarVentaAction(entrada: unknown) {
  try {
    const usuario = await verificarPermiso("venta", "crear");
    const datos = crearVentaSchema.safeParse(entrada);
    if (!datos.success) return { ok: false as const, mensaje: datos.error.issues.map((issue) => issue.message).join(" ") };
    const resultado = await registrarVenta(datos.data, usuario.id);
    if (!resultado.ok) {
      return { ok: false as const, mensaje: resultado.errores.join(" ") };
    }
    revalidatePath("/ventas");
    revalidatePath("/ventas/nueva");
    revalidatePath("/productos");
    revalidatePath("/clientes");
    return { ok: true as const, ventaId: Number(resultado.venta.id), advertencias: resultado.advertencias };
  } catch (error) {
    return { ok: false as const, mensaje: mensajeErrorAccion("registrarVentaAction", error) };
  }
}
