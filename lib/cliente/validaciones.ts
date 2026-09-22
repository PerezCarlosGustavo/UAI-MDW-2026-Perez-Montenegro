export function validarCliente(data: any) {
  const errores: string[] = [];

  if (!data.nombre || data.nombre.trim().length === 0) {
    errores.push("El nombre es obligatorio.");
  }

  if (data.email && !data.email.includes("@")) {
    errores.push("El email es inválido.");
  }

  if (data.telefono && data.telefono.length < 6) {
    errores.push("El teléfono es inválido.");
  }

  if (errores.length > 0) {
    return { ok: false, errores };
  }

  return { ok: true };
}
