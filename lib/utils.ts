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
