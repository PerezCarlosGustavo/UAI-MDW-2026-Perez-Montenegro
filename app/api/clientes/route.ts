import { verificarPermiso } from "@/lib/auth/verificarPermiso";
import { crearCliente } from "@/lib/db/clientes";
import { responderJson } from "@/lib/utils";
import { validarCliente } from "@/lib/cliente/validaciones";
import { validarReglasCliente } from "@/lib/cliente/reglas";
import { responderError } from "@/lib/errores";
import { crearClienteSchema } from "@/lib/schemas/cliente";
import { prisma } from "@/lib/db/client";

// GET /api/clientes → GetAll de clientes con id y nombre.
export async function GET(req: Request) {
  try {
    await verificarPermiso("cliente", "ver");

    const url = new URL(req.url);
    const incluirInactivos = url.searchParams.get("incluirInactivos") === "true";

    const clientes = await prisma.cliente.findMany({
      where: incluirInactivos ? {} : { activo: true },
      orderBy: { nombre: "asc" },
      select: {
        id: true,
        nombre: true,
      },
      take: 200,
    });

    return responderJson(clientes);
  } catch (error) {
    return responderError("GET /api/clientes", error);
  }
}

export async function POST(req: Request) {
  try {
    await verificarPermiso("cliente", "crear");

    const resultado = crearClienteSchema.safeParse(await req.json());
    if (!resultado.success) {
      return Response.json(
        { error: "Validación fallida", detalles: resultado.error.issues.map((issue) => issue.message) },
        { status: 400 }
      );
    }
    const data = resultado.data;

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

    const cliente = await crearCliente(data);

    return responderJson(cliente, 201);
  } catch (error) {
    return responderError("POST /api/clientes", error);
  }
}
