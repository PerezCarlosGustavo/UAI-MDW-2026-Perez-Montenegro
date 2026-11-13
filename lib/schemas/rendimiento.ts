import { z } from "zod";

// Credenciales del Docker de pruebas. Esta URL no viene de .env.local.
export const URL_RENDIMIENTO =
  "postgresql://postgres:postgres@127.0.0.1:54329/almacen_rendimiento";

export const entornoRendimientoSchema = z.object({
  DATABASE_URL: z.literal(URL_RENDIMIENTO),
  DIRECT_URL: z.literal(URL_RENDIMIENTO),
});

export const casoRendimientoSchema = z.enum([
  "nombre_selectivo",
  "nombre_frecuente",
  "nombre_sin_coincidencias",
  "buscador_completo_selectivo",
]);

export const explicacionRendimientoSchema = z.object({
  "Execution Time": z.number().nonnegative(),
  "Planning Time": z.number().nonnegative(),
  Plan: z.record(z.unknown()),
}).passthrough();

export const respuestaExplainSchema = z.tuple([z.object({
  "QUERY PLAN": z.tuple([explicacionRendimientoSchema]),
})]);

export const muestraRendimientoSchema = z.object({
  estado: z.enum(["sin_indice", "con_indice"]),
  caso: casoRendimientoSchema,
  repeticion: z.number().int().min(1).max(5),
  explicacion: explicacionRendimientoSchema,
});

export const informacionRendimientoSchema = z.tuple([z.object({
  base: z.literal("almacen_rendimiento"),
  version: z.string(),
  shared_buffers: z.string(),
  work_mem: z.string(),
  max_parallel_workers_per_gather: z.string(),
})]);

export const tamanioIndiceRendimientoSchema = z.tuple([z.object({
  tamanio: z.string(),
})]);

export type MuestraRendimiento = z.infer<typeof muestraRendimientoSchema>;
