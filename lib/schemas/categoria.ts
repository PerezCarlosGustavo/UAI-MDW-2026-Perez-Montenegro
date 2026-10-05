import { z } from "zod";

export const crearCategoriaSchema = z.object({
  nombre: z
    .string()
    .trim()
    .min(1, "El nombre es obligatorio")
    .max(100, "El nombre no puede superar los 100 caracteres"),
  activa: z.boolean().optional().default(true),
});

export type CrearCategoriaInput = z.infer<typeof crearCategoriaSchema>;
