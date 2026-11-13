import { Prisma } from "@prisma/client";
import { prisma } from "./client";
import {
  entornoRendimientoSchema,
  informacionRendimientoSchema,
  respuestaExplainSchema,
  tamanioIndiceRendimientoSchema,
  type MuestraRendimiento,
} from "../schemas/rendimiento";

const TOTAL_PRODUCTOS = 200_000;
const TAMANIO_LOTE = 1_000;
const CATEGORIA = "Medición sintética";
const NOMBRES = ["Arroz", "Fideos", "Leche", "Aceite", "Galletitas", "Azúcar", "Harina", "Sal", "Café", "Agua"];

function exigirConexionLocal() {
  if (!entornoRendimientoSchema.safeParse(process.env).success) {
    throw new Error("Rendimiento solo permite el Docker local 127.0.0.1:54329/almacen_rendimiento.");
  }
}

async function obtenerInformacionLocal() {
  exigirConexionLocal();
  const respuesta = await prisma.$queryRaw`
    SELECT current_database() AS base, version() AS version,
           current_setting('shared_buffers') AS shared_buffers,
           current_setting('work_mem') AS work_mem,
           current_setting('max_parallel_workers_per_gather') AS max_parallel_workers_per_gather
  `;
  return informacionRendimientoSchema.parse(respuesta)[0];
}

/** Carga persistente e idempotente: las repeticiones omiten codigos existentes. */
export async function cargarProductosRendimiento() {
  await obtenerInformacionLocal();
  const ajenos = await prisma.producto.count({
    where: { categoria: { nombre: { not: CATEGORIA } } },
  });
  if (ajenos > 0) {
    throw new Error("La base de rendimiento contiene productos ajenos al seed; usar una base exclusiva.");
  }

  const categoria = await prisma.categoria.upsert({
    where: { nombre: CATEGORIA }, update: {}, create: { nombre: CATEGORIA },
  });
  let insertados = 0;
  for (let inicio = 1; inicio <= TOTAL_PRODUCTOS; inicio += TAMANIO_LOTE) {
    const datos: Prisma.productoCreateManyInput[] = [];
    for (let n = inicio; n < inicio + TAMANIO_LOTE && n <= TOTAL_PRODUCTOS; n++) {
      datos.push({
        categoriaid: categoria.id,
        nombre: `${n % 1000 === 0 ? "Yerba mate" : NOMBRES[n % 10]} ${String(n).padStart(6, "0")}`,
        codigobarra: `779${String(n).padStart(10, "0")}`,
        preciolista: 1000,
        stockactual: 100,
        permitestock: true,
        activo: n % 10 !== 1,
      });
    }
    const lote = await prisma.producto.createMany({ data: datos, skipDuplicates: true });
    insertados += lote.count;
    if ((inicio + TAMANIO_LOTE - 1) % 10_000 === 0) {
      console.log(`Procesados ${inicio + TAMANIO_LOTE - 1}/${TOTAL_PRODUCTOS}`);
    }
  }

  return {
    insertados,
    total: await prisma.producto.count(),
    activos: await prisma.producto.count({ where: { activo: true } }),
  };
}

// La excepcion provoca ROLLBACK solo de los cambios de indice de la medicion.
// Los productos ya insertados por el seed quedan guardados.
class MedicionFinalizada extends Error {
  constructor(readonly muestras: MuestraRendimiento[], readonly tamanioIndice: string) {
    super("Medicion finalizada; restaurar el indice mediante ROLLBACK.");
  }
}

export async function medirIndiceRendimiento() {
  const informacion = await obtenerInformacionLocal();
  const productos = await prisma.producto.count();
  if (productos !== TOTAL_PRODUCTOS) {
    throw new Error(`Se esperaban ${TOTAL_PRODUCTOS} productos; hay ${productos}. Ejecutar npm run db:seed:rendimiento.`);
  }
  const activos = await prisma.producto.count({ where: { activo: true } });
  await prisma.$executeRaw`ANALYZE public.producto`;

  const consultas = [
    { nombre: "nombre_selectivo" as const, sql: Prisma.sql`SELECT * FROM public.producto WHERE activo AND nombre ILIKE ${"%YeRbA%"} ORDER BY nombre ASC LIMIT 20` },
    { nombre: "nombre_frecuente" as const, sql: Prisma.sql`SELECT * FROM public.producto WHERE activo AND nombre ILIKE ${"%arroz%"} ORDER BY nombre ASC LIMIT 20` },
    { nombre: "nombre_sin_coincidencias" as const, sql: Prisma.sql`SELECT * FROM public.producto WHERE activo AND nombre ILIKE ${"%inexistentezz%"} ORDER BY nombre ASC LIMIT 20` },
    { nombre: "buscador_completo_selectivo" as const, sql: Prisma.sql`SELECT * FROM public.producto WHERE activo AND (nombre ILIKE ${"%YeRbA%"} OR codigobarra LIKE ${"YeRbA%"}) ORDER BY nombre ASC LIMIT 20` },
  ];

  try {
    await prisma.$transaction(async (tx) => {
      const muestras: MuestraRendimiento[] = [];
      for (const estado of ["sin_indice", "con_indice"] as const) {
        if (estado === "sin_indice") {
          await tx.$executeRaw`DROP INDEX public.ix_producto_nombre_trgm`;
        } else {
          await tx.$executeRaw`CREATE INDEX ix_producto_nombre_trgm ON public.producto USING GIN (nombre gin_trgm_ops)`;
        }
        for (const consulta of consultas) {
          for (let repeticion = 0; repeticion <= 5; repeticion++) {
            const respuesta = await tx.$queryRaw(Prisma.sql`EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) ${consulta.sql}`);
            const explicacion = respuestaExplainSchema.parse(respuesta)[0]["QUERY PLAN"][0];
            if (repeticion > 0) muestras.push({ estado, caso: consulta.nombre, repeticion, explicacion });
          }
        }
      }
      const respuesta = await tx.$queryRaw`SELECT pg_size_pretty(pg_relation_size('public.ix_producto_nombre_trgm')) AS tamanio`;
      const tamanio = tamanioIndiceRendimientoSchema.parse(respuesta)[0].tamanio;
      throw new MedicionFinalizada(muestras, tamanio);
    }, { maxWait: 10_000, timeout: 120_000 });
  } catch (error: unknown) {
    if (!(error instanceof MedicionFinalizada)) throw error;
    const resumen = consultas.map(({ nombre: caso }) => {
      const mediana = (estado: MuestraRendimiento["estado"]) => {
        const tiempos = error.muestras.filter((m) => m.caso === caso && m.estado === estado)
          .map((m) => m.explicacion["Execution Time"]).sort((a, b) => a - b);
        const valor = tiempos[2];
        if (tiempos.length !== 5 || valor === undefined) {
          throw new Error(`Medicion incompleta para ${caso}, ${estado}.`);
        }
        return valor;
      };
      const sinIndiceMs = mediana("sin_indice");
      const conIndiceMs = mediana("con_indice");
      return { caso, sinIndiceMs, conIndiceMs, factor: conIndiceMs > 0 ? sinIndiceMs / conIndiceMs : null };
    });
    return { fecha: new Date().toISOString(), ...informacion, productos, activos,
      tamanioIndice: error.tamanioIndice, resumen, muestras: error.muestras };
  }
  throw new Error("La medicion no produjo resultados.");
}
