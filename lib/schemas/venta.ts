import { z } from "zod";

export const crearVentaSchema = z.object({
  fecha: z.coerce.date().optional(),
  clienteid: z.coerce.number().int().positive().optional().nullable(),
  usuarioid: z.coerce.number().int().positive(),
  tipopago: z.coerce.number().int().min(0),
  total: z.coerce.number().nonnegative().optional().default(0),
});

export type CrearVentaInput = z.infer<typeof crearVentaSchema>;
