import "./rendimiento.config";
import { writeFile } from "node:fs/promises";
import path from "node:path";
import { prisma } from "../lib/db/client";
import { medirIndiceRendimiento } from "../lib/db/rendimiento";

async function main() {
  const resultado = await medirIndiceRendimiento();
  const filas = resultado.resumen.map((r) =>
    `| ${r.caso} | ${r.sinIndiceMs.toFixed(3)} | ${r.conIndiceMs.toFixed(3)} | ${r.factor?.toFixed(2) ?? "N/D"} |`
  ).join("\n");
  const informe = `# Rendimiento de la búsqueda de productos

Medición con Prisma del ${resultado.fecha}, exclusivamente en Docker local, base \`${resultado.base}\`.

## Datos y entorno

- Motor: ${resultado.version}.
- Productos: ${resultado.productos}; activos: ${resultado.activos}.
- shared_buffers: ${resultado.shared_buffers}; work_mem: ${resultado.work_mem}; max_parallel_workers_per_gather: ${resultado.max_parallel_workers_per_gather}.
- Índice: ix_producto_nombre_trgm, GIN con gin_trgm_ops. Tamaño con la carga: ${resultado.tamanioIndice}.

Los productos se insertaron con Prisma createMany, en lotes de 1.000 y con skipDuplicates. Se mantienen guardados después de medir. La distribución tiene Yerba mate cada 1.000 productos, diez familias de nombres y un 10 % de inactivos.

## Método y resultados

Se ejecutó ANALYZE antes de comparar. Se midieron las mismas consultas con y sin índice mediante EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON), enviado por Prisma con parámetros. Cada caso y escenario tiene una ejecución de calentamiento y cinco muestras; la tabla informa la mediana de Execution Time, en milisegundos.

| Caso | Sin índice (ms) | Con índice (ms) | Factor sin/con |
|---|---:|---:|---:|
${filas}

Todas las consultas filtran activos, ordenan por nombre y tienen LIMIT 20. Los tres casos de nombre usan ILIKE '%YeRbA%', '%arroz%' y '%inexistentezz%'. El buscador completo combina nombre ILIKE '%YeRbA%' OR codigobarra LIKE 'YeRbA%', como buscarProductosParaVender en lib/db/productos.ts. Un factor mayor que 1 indica mejora.

Los planes completos, los tiempos individuales y la información del entorno se guardan en [rendimiento-prisma.json](./rendimiento-prisma.json). El OR puede hacer que el buscador completo mantenga un escaneo secuencial; la mejora de nombre aislado no demuestra una mejora de esa consulta.

Son tiempos del motor con caché caliente, sobre datos sintéticos. Se midió primero sin índice y después con índice, sin forzar el planificador. No incluyen HTTP, transferencia, renderizado ni el tiempo de ida y vuelta de Prisma. No evalúan concurrencia, caché fría ni costo de escritura. No bastan para verificar el objetivo completo de 150 ms de la aplicación.

## Aislamiento y repetición

Guía paso a paso: [tutorial del seed de rendimiento](./tutorial-seed-rendimiento.md).

La configuración prisma/rendimiento.config.ts fija ambas conexiones a 127.0.0.1:54329/almacen_rendimiento y no carga .env.local. Los accesos verifican esa conexión y el nombre real de la base antes de escribir. No se utiliza Supabase.

La medición termina su transacción con ROLLBACK para restaurar el índice original; el seed ya estaba confirmado y los productos permanecen disponibles para Prisma Studio. No se modifica el modelo ni se necesita una nueva migración.

Desde CMD, con el Docker local iniciado y la base almacen_rendimiento creada:

~~~cmd
npm run db:seed:rendimiento
npm run db:medir:rendimiento
npm run db:studio:rendimiento
~~~

El seed aplica las migraciones existentes antes de cargar. Puede repetirse: omite los códigos ya insertados y muestra cuántos productos hay. No modifica el seed normal del proyecto. La salida de la medición anterior hecha con SQL se conserva en [rendimiento-salida.txt](./rendimiento-salida.txt).
`;
  await writeFile(path.resolve("docs/rendimiento-prisma.json"), JSON.stringify(resultado, null, 2) + "\n");
  await writeFile(path.resolve("docs/rendimiento.md"), informe);
  console.table(resultado.resumen);
  console.log("Informe actualizado en docs/rendimiento.md. Los productos siguen guardados.");
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
