import { z } from "zod";

const camposProductoSchema = z.object({
  categoriaid: z.coerce.number().int().positive(),
  nombre: z
    .string()
    .trim()
    .min(1, "El nombre es obligatorio")
    .max(150, "El nombre no puede superar los 150 caracteres"),
  codigobarra: z
    .string()
    .trim()
    .max(50, "El código de barras no puede superar los 50 caracteres")
    .optional()
    .nullable(),
  preciolista: z.coerce.number().nonnegative(),
  permitestock: z.boolean(),
  stockactual: z.coerce.number().nonnegative(),
  activo: z.boolean(),
});

export const crearProductoSchema = camposProductoSchema.extend({
  permitestock: z.boolean().optional().default(true),
  stockactual: z.coerce.number().nonnegative().optional().default(0),
  activo: z.boolean().optional().default(true),
});

export const actualizarProductoSchema = camposProductoSchema.partial();

export type CrearProductoInput = z.infer<typeof crearProductoSchema>;
export type ActualizarProductoInput = z.infer<typeof actualizarProductoSchema>;
