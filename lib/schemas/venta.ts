import { z } from "zod";
import { detalleVentaDeVentaSchema } from "@/lib/schemas/detalleventa";

export const crearVentaSchema = z.object({
  fecha: z.coerce.date().optional(),
  clienteid: z.coerce.number().int().positive().optional().nullable(),
  tipopago: z.coerce.number().int().min(0),
  total: z.coerce.number().nonnegative().optional().default(0),
  detalles: z.array(detalleVentaDeVentaSchema),
});

export type CrearVentaInput = z.infer<typeof crearVentaSchema>;
