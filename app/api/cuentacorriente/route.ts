export async function GET() {
  return Response.json({ ok: true, message: "Cuenta corriente disponible" });
}

export async function POST() {
  return Response.json({ ok: true, message: "Cuenta corriente creada" });
}
