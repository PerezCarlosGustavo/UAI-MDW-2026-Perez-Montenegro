import { describe, expect, it, vi } from "vitest";
import { obtenerEstadoCuentaCorriente, registrarCobranza } from "./cuentacorriente";
import { TIPO_MOVIMIENTO_CC } from "@/lib/reglas/tiposMovimientoCuentaCorriente";

const estado = vi.hoisted(() => {
  const movimientos: Record<string, unknown>[] = [];
  const agregar = (datos: Record<string, unknown>) => {
    const movimiento = { ventaid: null, productoid: null, cantidad: null, fecha: new Date(), ...datos, id: BigInt(movimientos.length + 1) };
    movimientos.push(movimiento);
    return movimiento;
  };
  const tx = {
    cliente: { findUnique: vi.fn(async () => ({ id: 1n })) },
    cuentacorriente: { findUnique: vi.fn(async () => ({ id: 1n })), upsert: vi.fn(async () => ({ id: 1n })) },
    cuentacorrientemovimiento: {
      findMany: vi.fn(async () => movimientos),
      create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => agregar(data)),
      createMany: vi.fn(async ({ data }: { data: Record<string, unknown>[] }) => { data.forEach(agregar); return { count: data.length }; }),
    },
    producto: { findMany: vi.fn(async () => [{ id: 2n, nombre: "Producto", preciolista: 800 }]) },
    $queryRaw: vi.fn(async () => [{ id: 1n }]),
  };
  return { movimientos, agregar, tx };
});

vi.mock("@/lib/db/client", () => ({
  prisma: { $transaction: (fn: (tx: typeof estado.tx) => unknown) => fn(estado.tx) },
}));

describe("registro y consulta de cobranzas", () => {
  it("aplica el saldo previo al segundo pago y reconstruye la cuenta saldada", async () => {
    estado.movimientos.length = 0;
    estado.agregar({ cuentacorrienteid: 1n, ventaid: 10n, productoid: 2n, tipo: TIPO_MOVIMIENTO_CC.DEUDA_VENTA, cantidad: 2, importe: 0 });
    const primerCobro = await registrarCobranza(1, 1000);
    expect(primerCobro).toMatchObject({ deudaRestante: 1600, saldoAFavor: 1000, pagados: [] });

    const segundoCobro = await registrarCobranza(1, 700);
    expect(segundoCobro).toMatchObject({ deudaRestante: 0, saldoAFavor: 100, saldoAFavorUsado: 1000 });
    expect(await obtenerEstadoCuentaCorriente(1, 1)).toMatchObject({ pendientes: [], totalDeuda: 0, saldoAFavor: 100 });
  });
});
