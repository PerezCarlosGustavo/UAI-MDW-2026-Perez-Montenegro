import { z } from "zod";

export const crearDetalleVentaSchema = z.object({
  ventaid: z.coerce.number().int().positive(),
  productoid: z.coerce.number().int().positive(),
  cantidad: z.coerce.number().positive(),
  preciounitario: z.coerce.number().nonnegative(),
  subtotal: z.coerce.number().nonnegative(),
});

export const detalleVentaDeVentaSchema = crearDetalleVentaSchema.omit({ ventaid: true });

export type CrearDetalleVentaInput = z.infer<typeof crearDetalleVentaSchema>;
export type DetalleVentaDeVentaInput = z.infer<typeof detalleVentaDeVentaSchema>;
