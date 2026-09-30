/**
 * La traducción de un error a una respuesta HTTP. Un solo lugar.
 *
 * Cada handler envuelve su cuerpo en un try/catch que termina acá. Los errores
 * esperados de validación (400) y de reglas de negocio (409) no pasan por acá:
 * salen antes con `return`. Acá llegan los que se lanzan —autorización— y los
 * que nadie previó.
 */
import { Prisma } from "@prisma/client";
import { ErrorAutorizacion } from "@/lib/auth/errores";

/**
 * `endpoint` va en el log para saber qué ruta falló al leer los logs de Vercel.
 */
export function responderError(endpoint: string, error: unknown) {
  if (error instanceof ErrorAutorizacion) {
    return Response.json({ error: error.message }, { status: error.status });
  }

  // El body no es JSON válido, o el id de la URL no es un número:
  // `BigInt("abc")` también lanza SyntaxError.
  if (error instanceof SyntaxError) {
    return Response.json({ error: "Solicitud inválida" }, { status: 400 });
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    // update/delete sobre un id que no existe.
    if (error.code === "P2025") {
      return Response.json({ error: "Recurso inexistente" }, { status: 404 });
    }

    // Violación de un @unique (código de barras, documento, email).
    if (error.code === "P2002") {
      return Response.json(
        { error: "Ya existe un registro con ese valor" },
        { status: 409 }
      );
    }
  }

  // Lo no previsto: el detalle va al log, la respuesta no cuenta nada.
  console.error(endpoint, error);

  return Response.json({ error: "Error interno" }, { status: 500 });
}
