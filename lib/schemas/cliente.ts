import { z } from "zod";

const camposClienteSchema = z.object({
  nombre: z
    .string()
    .trim()
    .min(1, "El nombre es obligatorio")
    .max(150, "El nombre no puede superar los 150 caracteres"),
  documento: z
    .string()
    .trim()
    .max(30, "El documento no puede superar los 30 caracteres")
    .refine((valor) => valor.trim().length > 0, "El documento, si se informa, no puede quedar vacío.")
    .optional()
    .nullable(),
  telefono: z
    .string()
    .trim()
    .max(50, "El teléfono no puede superar los 50 caracteres")
    .refine((valor) => valor.trim().length === 0 || valor.trim().length >= 6, "El teléfono es inválido.")
    .optional()
    .nullable(),
});

export const crearClienteSchema = camposClienteSchema.extend({
  activo: z.boolean().optional().default(true),
});

export const actualizarClienteSchema = camposClienteSchema.partial().extend({
  activo: z.boolean().optional(),
});

export type CrearClienteInput = z.infer<typeof crearClienteSchema>;
export type ActualizarClienteInput = z.infer<typeof actualizarClienteSchema>;
