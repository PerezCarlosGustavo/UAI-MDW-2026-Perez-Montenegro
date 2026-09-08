import { z } from "zod";

export const crearCuentaCorrienteSchema = z.object({
  clienteid: z.coerce.number().int().positive(),
});

export type CrearCuentaCorrienteInput = z.infer<
  typeof crearCuentaCorrienteSchema
>;
