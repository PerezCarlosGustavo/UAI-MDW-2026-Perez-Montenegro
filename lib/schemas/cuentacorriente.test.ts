import { describe, expect, it } from "vitest";
import { crearCobranzaSchema, listarCuentaCorrienteQuerySchema } from "./cuentacorriente";
import { crearCuentaCorrienteMovimientoSchema } from "./cuentacorrientemovimiento";

describe("schemas de cuenta corriente", () => {
  it("valida cliente y monto positivo para una cobranza", () => {
    expect(crearCobranzaSchema.safeParse({ clienteid: "12", monto: "2500.50" }).success).toBe(true);
    expect(crearCobranzaSchema.safeParse({ clienteid: 12, monto: 0 }).success).toBe(false);
  });

  it("usa la primera página por defecto y rechaza páginas inválidas", () => {
    expect(listarCuentaCorrienteQuerySchema.parse({})).toEqual({ pagina: 1 });
    expect(listarCuentaCorrienteQuerySchema.safeParse({ pagina: 0 }).success).toBe(false);
  });

  it("solo acepta tipos de movimiento definidos para el ledger", () => {
    const base = { cuentacorrienteid: 1, importe: 0 };
    expect(crearCuentaCorrienteMovimientoSchema.safeParse({ ...base, tipo: 1 }).success).toBe(true);
    expect(crearCuentaCorrienteMovimientoSchema.safeParse({ ...base, tipo: 9 }).success).toBe(false);
  });
});