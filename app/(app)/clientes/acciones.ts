"use server";

import { revalidatePath } from "next/cache";
import { verificarPermiso } from "@/lib/auth/verificarPermiso";
import { mensajeErrorAccion } from "@/lib/acciones/errores";
import { crearCliente } from "@/lib/db/clientes";
import { registrarCobranza } from "@/lib/db/cuentacorriente";
import { crearClienteSchema } from "@/lib/schemas/cliente";
import { crearCobranzaSchema } from "@/lib/schemas/cuentacorriente";
import { validarCliente } from "@/lib/cliente/validaciones";
import { validarReglasCliente } from "@/lib/cliente/reglas";

export async function crearClienteAction(entrada: unknown) {
  try {
    await verificarPermiso("cliente", "crear");
    const datos = crearClienteSchema.safeParse(entrada);
    if (!datos.success) return {
      ok: false as const,
      mensaje: "Revisá los campos del formulario.",
      errores: datos.error.flatten().fieldErrors
    };
    const validacion = validarCliente(datos.data);
    if (!validacion.ok) return { ok: false as const, mensaje: validacion.errores?.join(" ") ?? "Cliente inválido." };
    const reglas = await validarReglasCliente(datos.data);
    if (!reglas.ok) return { ok: false as const, mensaje: reglas.errores?.join(" ") ?? "No se pudo crear el cliente." };
    const cliente = await crearCliente(datos.data);
    revalidatePath("/clientes");
    revalidatePath("/ventas");
    return { ok: true as const, cliente: { id: Number(cliente.id), nombre: cliente.nombre } };
  } catch (error) {
    return { ok: false as const, mensaje: mensajeErrorAccion("crearClienteAction", error) };
  }
}

export async function registrarCobranzaAction(entrada: unknown) {
  try {
    await verificarPermiso("cuentacorriente", "cobrar");
    const datos = crearCobranzaSchema.safeParse(entrada);
    if (!datos.success) return { ok: false as const, mensaje: datos.error.issues.map((issue) => issue.message).join(" ") };
    const cobranza = await registrarCobranza(datos.data.clienteid, datos.data.monto);
    if (!cobranza) return { ok: false as const, mensaje: "Cliente no encontrado." };
    revalidatePath("/clientes");
    revalidatePath(`/clientes/${datos.data.clienteid}`);
    return { ok: true as const, cobranza };
  } catch (error) {
    return { ok: false as const, mensaje: mensajeErrorAccion("registrarCobranzaAction", error) };
  }
}
