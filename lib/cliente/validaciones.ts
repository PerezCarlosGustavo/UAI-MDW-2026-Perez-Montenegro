import type { ActualizarClienteInput, CrearClienteInput } from "@/lib/schemas/cliente";

export function validarCliente(data: ActualizarClienteInput | CrearClienteInput) {
  const errores: string[] = [];

  if (data.nombre !== undefined && data.nombre.trim().length === 0) {
    errores.push("El nombre es obligatorio.");
  }

  if (data.documento !== undefined && data.documento !== null && data.documento.trim().length === 0) {
    errores.push("El documento, si se informa, no puede quedar vacío.");
  }

  if (data.telefono !== undefined && data.telefono !== null && data.telefono.trim().length > 0 && data.telefono.trim().length < 6) {
    errores.push("El teléfono es inválido.");
  }

  if (errores.length > 0) {
    return { ok: false, errores };
  }

  return { ok: true };
}
