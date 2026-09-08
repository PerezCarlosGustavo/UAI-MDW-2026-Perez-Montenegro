import { z } from "zod";

export const crearProductoSchema = z.object({
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
  permitestock: z.boolean().optional().default(true),
  stockactual: z.coerce.number().nonnegative().optional().default(0),
  activo: z.boolean().optional().default(true),
});

export type CrearProductoInput = z.infer<typeof crearProductoSchema>;
