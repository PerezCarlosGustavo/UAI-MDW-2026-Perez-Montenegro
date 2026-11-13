import path from "node:path";
import { defineConfig } from "prisma/config";
import { URL_RENDIMIENTO } from "../lib/schemas/rendimiento";

// Configuracion exclusiva de esta tarea: ignora las conexiones del entorno
// y no importa prisma.config.ts, que carga .env.local (Supabase).
process.env.DATABASE_URL = URL_RENDIMIENTO;
process.env.DIRECT_URL = URL_RENDIMIENTO;

export default defineConfig({
  schema: path.resolve("prisma/schema.prisma"),
  migrations: {
    path: path.resolve("prisma/migrations"),
    seed: "tsx prisma/seedRendimiento.ts",
  },
});
