import { z } from "zod";
import type { Rol } from "@prisma/client";

// Los mismos valores que el enum de Prisma. El `satisfies` hace que falle la
// compilación si alguien agrega un rol acá que no existe en la base.
export const ROLES = ["ADMIN", "VENDEDOR", "PENDIENTE"] as const satisfies readonly Rol[];

export const rolSchema = z.enum(ROLES, {
  errorMap: () => ({ message: "El rol debe ser ADMIN, VENDEDOR o PENDIENTE" }),
});

// Lo único que el ABM puede cambiar de un usuario: su rol y si está activo.
// El nombre y el mail vienen de Google.
export const actualizarUsuarioSchema = z
  .object({
    rol: rolSchema.optional(),
    activo: z.boolean().optional(),
  })
  .strict()
  .refine((datos) => datos.rol !== undefined || datos.activo !== undefined, {
    message: "Indicá el rol o si el usuario está activo",
  });

// Query string de GET /api/usuarios: ?rol=PENDIENTE para ver a quién aprobar.
export const filtroUsuariosSchema = z.object({
  rol: rolSchema.optional(),
});

export type ActualizarUsuarioInput = z.infer<typeof actualizarUsuarioSchema>;

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
