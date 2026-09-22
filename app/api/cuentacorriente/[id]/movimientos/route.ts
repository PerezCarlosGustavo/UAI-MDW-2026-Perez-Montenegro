export async function GET() {
  return Response.json({ ok: true, movimientos: [] });
}

export async function POST() {
  return Response.json({ ok: true, message: "Movimiento registrado" });
}
