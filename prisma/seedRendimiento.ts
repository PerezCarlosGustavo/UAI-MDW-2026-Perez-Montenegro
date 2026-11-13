import "./rendimiento.config";
import { prisma } from "../lib/db/client";
import { cargarProductosRendimiento } from "../lib/db/rendimiento";

cargarProductosRendimiento()
  .then((resultado) => console.log("Seed local finalizado:", resultado))
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
