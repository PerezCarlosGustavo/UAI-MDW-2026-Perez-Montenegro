import { verificarPermiso } from "@/lib/auth/verificarPermiso";
import { prisma } from "@/lib/db/client";
import { validarProducto } from "@/lib/producto/validaciones";
import { validarReglasProducto } from "@/lib/producto/reglas";
import { respuestaErrorAutorizacion } from "@/lib/auth/errores";

export async function POST(req: Request) {
  try {
    await verificarPermiso("producto", "crear");
  } catch (error) {
    return respuestaErrorAutorizacion(error) ?? Response.json({ error: "Error interno" }, { status: 500 });
  }

  const data = await req.json();

  // Validaciones básicas (forma)
  const validacion = validarProducto(data);
  if (!validacion.ok) {
    return Response.json(
      { error: "Validación fallida", detalles: validacion.errores },
      { status: 400 }
    );
  }

  // Reglas de negocio (clase 5)
  const reglas = await validarReglasProducto(data);
  if (!reglas.ok) {
    return Response.json(
      { error: "Reglas de negocio fallidas", detalles: reglas.errores },
      { status: 409 }
    );
  }

  const producto = await prisma.producto.create({
    data: {
      nombre: data.nombre,
      categoriaid: BigInt(data.categoriaid),
      codigobarra: data.codigobarra,
      preciolista: data.preciolista,
      permitestock: data.permitestock,
      stockactual: data.stockactual,
      activo: data.activo ?? true,
    },
  });

  return Response.json(producto);
}
