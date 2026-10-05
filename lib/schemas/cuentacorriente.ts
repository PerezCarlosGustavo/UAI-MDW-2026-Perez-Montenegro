import { z } from "zod";

export const crearCuentaCorrienteSchema = z.object({
  clienteid: z.coerce.number().int().positive(),
});

export const listarCuentaCorrienteQuerySchema = z.object({
  pagina: z.coerce.number().int().min(1, "La página empieza en 1").default(1),
});

export const crearCobranzaSchema = z.object({
  clienteid: z.coerce.number().int().positive(),
  monto: z.coerce.number().finite().positive("El monto debe ser mayor a 0").multipleOf(0.01),
});

export type CrearCuentaCorrienteInput = z.infer<
  typeof crearCuentaCorrienteSchema
>;

export type CrearCobranzaInput = z.infer<typeof crearCobranzaSchema>;
