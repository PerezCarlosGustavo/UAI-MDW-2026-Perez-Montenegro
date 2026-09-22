import { verificarPermiso } from "@/lib/auth/verificarPermiso";
import { prisma } from "@/lib/db/client";
import { validarCliente } from "@/lib/cliente/validaciones";
import { validarReglasCliente } from "@/lib/cliente/reglas";
import { respuestaErrorAutorizacion } from "@/lib/auth/errores";

export async function POST(req: Request) {
  try {
    await verificarPermiso("cliente", "crear");
  } catch (error) {
    return respuestaErrorAutorizacion(error) ?? Response.json({ error: "Error interno" }, { status: 500 });
  }

  const data = await req.json();

  // Validaciones básicas
  const validacion = validarCliente(data);
  if (!validacion.ok) {
    return Response.json(
      { error: "Validación fallida", detalles: validacion.errores },
      { status: 400 }
    );
  }

  // Reglas de negocio
  const reglas = await validarReglasCliente(data);
  if (!reglas.ok) {
    return Response.json(
      { error: "Reglas de negocio fallidas", detalles: reglas.errores },
      { status: 409 }
    );
  }

  const cliente = await prisma.cliente.create({
    data: {
      nombre: data.nombre,
      documento: data.documento,
      telefono: data.telefono,
      activo: data.activo ?? true,
    },
  });

  return Response.json(cliente);
}
