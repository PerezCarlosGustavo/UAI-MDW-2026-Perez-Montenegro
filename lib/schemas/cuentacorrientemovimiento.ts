import { z } from "zod";
import { TIPO_MOVIMIENTO_CC } from "@/lib/reglas/tiposMovimientoCuentaCorriente";

export const crearCuentaCorrienteMovimientoSchema = z.object({
  cuentacorrienteid: z.coerce.number().int().positive(),
  ventaid: z.coerce.number().int().positive().optional().nullable(),
  productoid: z.coerce.number().int().positive().optional().nullable(),
  fecha: z.coerce.date().optional(),
  tipo: z.coerce.number().int().pipe(z.nativeEnum(TIPO_MOVIMIENTO_CC)),
  cantidad: z.coerce.number().optional().nullable(),
  importe: z.coerce.number().nonnegative(),
});

export type CrearCuentaCorrienteMovimientoInput = z.infer<
  typeof crearCuentaCorrienteMovimientoSchema
>;
