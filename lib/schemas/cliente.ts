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
    .regex(/^[+\d\s().-]*$/, "El teléfono solo puede contener números, espacios, +, paréntesis, puntos y guiones.")
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

// Query string de GET /api/clientes. Solo se acepta "true" o "false": otra
// cosa es un error del que llama, no un "false" silencioso.
export const listarClientesQuerySchema = z.object({
  incluirInactivos: z
    .enum(["true", "false"], {
      errorMap: () => ({ message: "incluirInactivos debe ser true o false" }),
    })
    .optional()
    .transform((valor) => valor === "true"),
});

export type CrearClienteInput = z.infer<typeof crearClienteSchema>;
export type ActualizarClienteInput = z.infer<typeof actualizarClienteSchema>;

export const clienteCreadoSchema = z.object({
  id: z.number().int().positive(),
  nombre: z.string(),
});

export const buscarClienteParaVentaSchema = z.string().trim().min(1).max(150);
export const clienteParaVentaSchema = clienteCreadoSchema.extend({ esConsumidorFinal: z.boolean() });
export type ClienteSeleccionable = z.infer<typeof clienteParaVentaSchema>;

export const errorClienteSchema = z.object({
  error: z.string(),
  detalles: z.array(z.string()).optional(),
});
