import { verificarPermiso } from "@/lib/auth/verificarPermiso";
import { actualizarCliente, desactivarCliente, obtenerCliente } from "@/lib/db/clientes";
import { responderJson } from "@/lib/utils";
import { validarCliente } from "@/lib/cliente/validaciones";
import { validarReglasCliente } from "@/lib/cliente/reglas";
import { responderError } from "@/lib/errores";
import { actualizarClienteSchema } from "@/lib/schemas/cliente";

type Contexto = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Contexto) {
  try {
    await verificarPermiso("cliente", "ver");

    const { id } = await params;
    const cliente = await obtenerCliente(BigInt(id));

    if (!cliente) {
      return Response.json({ error: "Cliente no encontrado" }, { status: 404 });
    }

    return responderJson(cliente);
  } catch (error) {
    return responderError("GET /api/clientes/:id", error);
  }
}

export async function PUT(req: Request, { params }: Contexto) {
  try {
    await verificarPermiso("cliente", "editar");

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

    const cliente = await actualizarCliente(id, data);

    return responderJson(cliente);
  } catch (error) {
    return responderError("PUT /api/clientes/:id", error);
  }
}

// DELETE = baja lógica (activo = false). Aplica la misma regla que desactivar
// por PUT: un cliente con movimientos en cuenta corriente no se puede dar de
// baja (409). Si el id no existe, responderError devuelve 404.
export async function DELETE(_req: Request, { params }: Contexto) {
  try {
    await verificarPermiso("cliente", "borrar");

    const { id: idParam } = await params;
    const id = BigInt(idParam);

    const reglas = await validarReglasCliente({ activo: false }, id);
    if (!reglas.ok) {
      return Response.json(
        { error: "Reglas de negocio fallidas", detalles: reglas.errores },
        { status: 409 }
      );
    }

    const cliente = await desactivarCliente(id);

    return responderJson(cliente);
  } catch (error) {
    return responderError("DELETE /api/clientes/:id", error);
  }
}
