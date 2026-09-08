import { z } from "zod";

export const crearUsuarioSchema = z.object({
  nombre: z
    .string()
    .trim()
    .min(1, "El nombre es obligatorio")
    .max(150, "El nombre no puede superar los 150 caracteres"),
  usuario: z
    .string()
    .trim()
    .min(1, "El usuario es obligatorio")
    .max(100, "El usuario no puede superar los 100 caracteres"),
  activo: z.boolean().optional().default(true),
});

export type CrearUsuarioInput = z.infer<typeof crearUsuarioSchema>;
