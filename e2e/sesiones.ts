/** Dónde quedan las sesiones de prueba que arma `preparar.ts`. */
import path from "node:path";

const carpeta = path.join(__dirname, ".sesiones");

export const SESION = {
  admin: path.join(carpeta, "admin.json"),
  vendedor: path.join(carpeta, "vendedor.json"),
  otroVendedor: path.join(carpeta, "otro-vendedor.json"),
  pendiente: path.join(carpeta, "pendiente.json"),
  inactivo: path.join(carpeta, "inactivo.json"),
} as const;
