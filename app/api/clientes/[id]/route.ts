import { verificarPermiso } from "@/lib/auth/verificarPermiso";
import { prisma } from "@/lib/db/client";
import { validarCliente } from "@/lib/cliente/validaciones";
import { validarReglasCliente } from "@/lib/cliente/reglas";
import { respuestaErrorAutorizacion } from "@/lib/auth/errores";
import { actualizarClienteSchema } from "@/lib/schemas/cliente";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await verificarPermiso("cliente", "editar");
  } catch (error) {
    return respuestaErrorAutorizacion(error) ?? Response.json({ error: "Error interno" }, { status: 500 });
  }

  const { id: idParam } = await params;
  const resultado = actualizarClienteSchema.safeParse(await req.json());
  if (!resultado.success) {
    return Response.json(
      { error: "Validación fallida", detalles: resultado.error.issues.map((issue) => issue.message) },
      { status: 400 }
    );
  }
  const data = resultado.data;
  const id = BigInt(idParam);

  const validacion = validarCliente(data);
  if (!validacion.ok) {
    return Response.json(
      { error: "Validación fallida", detalles: validacion.errores },
      { status: 400 }
    );
  }

  const reglas = await validarReglasCliente(data, id);
  if (!reglas.ok) {
    return Response.json(
      { error: "Reglas de negocio fallidas", detalles: reglas.errores },
      { status: 409 }
    );
  }

  const cliente = await prisma.cliente.update({
    where: { id },
    data,
  });

  return Response.json(cliente);
}
