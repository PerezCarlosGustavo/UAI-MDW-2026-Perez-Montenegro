const formatoPesos = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  minimumFractionDigits: 2,
});

const formatoFechaHora = new Intl.DateTimeFormat("es-AR", {
  dateStyle: "medium",
  timeStyle: "short",
});

/** 2500 → "$ 2.500,00". Un solo formato de plata para todas las pantallas. */
export function formatearPesos(importe: number) {
  return formatoPesos.format(importe);
}

/** Fecha y hora en formato argentino, ej. "26 oct 2026, 18:30". */
export function formatearFechaHora(fecha: Date | string) {
  return formatoFechaHora.format(new Date(fecha));
}

/**
 * Responde JSON sabiendo convertir BigInt.
 *
 * Los ids del schema son BigInt, y `Response.json()` usa JSON.stringify, que
 * lanza "Do not know how to serialize a BigInt". Sin esto, el endpoint escribe
 * en la base y después responde 500. Los ids se devuelven como number, que es
 * lo que ya espera el frontend.
 */
export function responderJson(data: unknown, status: number = 200) {
  const body = JSON.stringify(data, (_clave, valor) =>
    typeof valor === "bigint" ? Number(valor) : valor
  );

  return new Response(body, {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
