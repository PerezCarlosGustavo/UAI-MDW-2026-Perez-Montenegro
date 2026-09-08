import { z } from "zod";

export const crearClienteSchema = z.object({
  nombre: z
    .string()
    .trim()
    .min(1, "El nombre es obligatorio")
    .max(150, "El nombre no puede superar los 150 caracteres"),
  documento: z
    .string()
    .trim()
    .max(30, "El documento no puede superar los 30 caracteres")
    .optional()
    .nullable(),
  telefono: z
    .string()
    .trim()
    .max(50, "El teléfono no puede superar los 50 caracteres")
    .optional()
    .nullable(),
  activo: z.boolean().optional().default(true),
});

export type CrearClienteInput = z.infer<typeof crearClienteSchema>;
