/**
 * Las pruebas de punta a punta: la app compilada, una base local y un navegador.
 *
 *   npm test           reglas y acciones, sin levantar nada (vitest)
 *   npm run test:e2e   el sistema entero (esto)
 */
import path from "node:path";
import { config as cargarEnv } from "dotenv";
import { defineConfig, devices } from "@playwright/test";

// Las variables de CI ganan: dotenv no pisa lo que ya está definido.
cargarEnv({ path: path.join(__dirname, ".env.e2e"), quiet: true });

// Estas pruebas registran ventas y cobros, y la base de desarrollo es la de
// producción. Si cualquiera de las dos conexiones no es local, no se arranca:
// DIRECT_URL también, porque es la que usa `prisma migrate deploy`.
for (const nombre of ["DATABASE_URL", "DIRECT_URL"]) {
  const { hostname } = new URL(process.env[nombre] ?? "postgresql://sin-definir");
  if (!["localhost", "127.0.0.1"].includes(hostname)) {
    throw new Error(`Las pruebas e2e solo corren contra una base local, y ${nombre} apunta a ${hostname}.`);
  }
}

const PUERTO = 3100;

export default defineConfig({
  testDir: "e2e",

  // Una sola base para todas las pruebas: en fila, no en paralelo.
  workers: 1,
  fullyParallel: false,

  // En CI se reintenta una vez; si pasa al segundo intento queda marcada como
  // inestable, no como verde.
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["list"]] : "list",

  globalSetup: "./e2e/preparar.ts",

  use: {
    baseURL: `http://localhost:${PUERTO}`,
    // Si falla queda grabado el recorrido: `npx playwright show-trace`.
    trace: "retain-on-failure",
  },

  projects: [{ name: "escritorio", use: { ...devices["Desktop Chrome"] } }],

  webServer: {
    command: `npm run build && npx next start --port ${PUERTO}`,
    url: `http://localhost:${PUERTO}/ingresar`,
    reuseExistingServer: false,
    timeout: 300_000,
    // En otra carpeta que `npm run dev`: compilar encima de un servidor de
    // desarrollo que está corriendo lo rompe.
    env: { NEXT_DIST_DIR: ".next-e2e" },
  },
});
