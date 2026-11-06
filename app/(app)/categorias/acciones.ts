"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { mensajeErrorAccion } from "@/lib/acciones/errores";
import { verificarPermiso } from "@/lib/auth/verificarPermiso";
import { crearCategoria } from "@/lib/db/categorias";
import type { EstadoCategoria } from "@/lib/categoria/categoria";
import { crearCategoriaSchema } from "@/lib/schemas/categoria";

export async function crearCategoriaAction(_estado: EstadoCategoria, formData: FormData): Promise<EstadoCategoria> {
  const valor = formData.get("nombre");
  const nombre = typeof valor === "string" ? valor : "";

  try {
    await verificarPermiso("categoria", "crear");
    const resultado = crearCategoriaSchema.safeParse({ nombre });
    if (!resultado.success) return { errores: resultado.error.flatten().fieldErrors, nombre };
    await crearCategoria(resultado.data);
  } catch (error) {
    return { mensaje: mensajeErrorAccion("crearCategoriaAction", error), nombre };
  }

  revalidatePath("/categorias");
  redirect("/categorias");
}
