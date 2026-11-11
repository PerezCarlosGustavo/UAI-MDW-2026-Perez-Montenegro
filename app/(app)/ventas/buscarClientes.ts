"use server";

import { verificarPermiso } from "@/lib/auth/verificarPermiso";
import { mensajeErrorAccion } from "@/lib/acciones/errores";
import { buscarClientesParaVenta } from "@/lib/db/clientes";
import { buscarClienteParaVentaSchema } from "@/lib/schemas/cliente";

export async function buscarClientesParaVentaAction(entrada: unknown) {
  try {
    await verificarPermiso("cliente", "ver");
    const resultado = buscarClienteParaVentaSchema.safeParse(entrada);
    if (!resultado.success) return { ok: false as const, mensaje: "Ingresá una búsqueda válida." };
    const clientes = await buscarClientesParaVenta(resultado.data);
    return { ok: true as const, clientes: clientes.map((cliente) => ({
      id: Number(cliente.id), nombre: cliente.nombre, esConsumidorFinal: cliente.documento === "0",
    })) };
  } catch (error) {
    return { ok: false as const, mensaje: mensajeErrorAccion("buscarClientesParaVentaAction", error) };
  }
}
