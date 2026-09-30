import { z } from "zod";
import { detalleVentaDeVentaSchema } from "@/lib/schemas/detalleventa";

export const crearVentaSchema = z.object({
  fecha: z.coerce.date().optional(),
  clienteid: z.coerce.number().int().positive().optional().nullable(),
  // 0 = contado, 1 = cuenta corriente. El 0 es un valor válido: no se puede
  // chequear con `!tipopago`, porque rechazaría todas las ventas al contado.
  tipopago: z.coerce
    .number()
    .int()
    .refine((valor) => valor === 0 || valor === 1, "El tipo de pago debe ser 0 (contado) o 1 (cuenta corriente)"),
  total: z.coerce.number().nonnegative().optional().default(0),
  detalles: z.array(detalleVentaDeVentaSchema),
});

export type CrearVentaInput = z.infer<typeof crearVentaSchema>;
