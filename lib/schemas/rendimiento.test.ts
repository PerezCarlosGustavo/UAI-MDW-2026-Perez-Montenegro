import { afterEach, describe, expect, it, vi } from "vitest";
import { entornoRendimientoSchema, URL_RENDIMIENTO } from "./rendimiento";

afterEach(() => vi.unstubAllEnvs());

describe("aislamiento de la medición de rendimiento", () => {
  it("acepta ambas conexiones a la base exclusiva de Docker", () => {
    expect(entornoRendimientoSchema.safeParse({
      DATABASE_URL: URL_RENDIMIENTO, DIRECT_URL: URL_RENDIMIENTO,
    }).success).toBe(true);
  });

  it.each([
    "postgresql://postgres:clave@db.ejemplo.supabase.co:5432/postgres",
    "postgresql://postgres:postgres@127.0.0.1:54329/almacen",
    "postgresql://postgres:postgres@127.0.0.1:5432/almacen_rendimiento",
    URL_RENDIMIENTO + "?host=servidor-remoto",
    "",
  ])("rechaza cambiar cualquiera de las conexiones: %s", (url) => {
    for (const campo of ["DATABASE_URL", "DIRECT_URL"] as const) {
      expect(entornoRendimientoSchema.safeParse({
        DATABASE_URL: URL_RENDIMIENTO, DIRECT_URL: URL_RENDIMIENTO, [campo]: url,
      }).success).toBe(false);
    }
  });

  it("la configuración dedicada reemplaza conexiones heredadas sin cargar la de desarrollo", async () => {
    vi.stubEnv("DATABASE_URL", "postgresql://usuario:clave@remoto:5432/postgres");
    vi.stubEnv("DIRECT_URL", "postgresql://usuario:clave@remoto:5432/postgres");
    await import("../../prisma/rendimiento.config");
    expect(process.env.DATABASE_URL).toBe(URL_RENDIMIENTO);
    expect(process.env.DIRECT_URL).toBe(URL_RENDIMIENTO);
  });
});
