# Tutorial: cargar el seed de rendimiento con Prisma en Docker

El objetivo es crear las tablas y guardar **200.000 productos** en la base local `almacen_rendimiento`. Después se pueden consultar con SQL, ver en Prisma Studio y usar para medir el índice de nombre.

Los comandos de este tutorial son para **CMD de Windows**. Las conexiones de Prisma se fijan en `prisma/rendimiento.config.ts`: no se carga `.env.local` ni se utiliza Supabase. Los comandos de Docker indican explícitamente el motor local de Docker Desktop.

## 1. Abrir CMD en el proyecto

Si estás dentro de PostgreSQL y el cursor termina en `=#` o `=>`, primero salí:

```text
\q
```

En CMD ejecutá:

```cmd
cd /d donde esta el proyecto
```

Los comandos `npm` se ejecutan acá, no dentro de la consola de PostgreSQL.

## 2. Comprobar el contenedor de PostgreSQL

Abrí Docker Desktop y esperá a que el motor arranque. Listá los contenedores locales:

```cmd
docker --host npipe:////./pipe/dockerDesktopLinuxEngine ps -a
```

Buscá `almacen-e2e`. Si está detenido, arrancalo:

```cmd
docker --host npipe:////./pipe/dockerDesktopLinuxEngine start almacen-e2e
```

**Solo si el contenedor no existe**, crealo con PostgreSQL 16 y el puerto esperado por Prisma:

```cmd
docker --host npipe:////./pipe/dockerDesktopLinuxEngine run -d --name almacen-e2e -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=almacen -p 127.0.0.1:54329:5432 -v almacen-e2e-data:/var/lib/postgresql/data postgres:16-alpine
```

Comprobá que PostgreSQL ya acepte conexiones:

```cmd
docker --host npipe:////./pipe/dockerDesktopLinuxEngine exec almacen-e2e pg_isready -U postgres -d postgres
```

Continuá cuando muestre `accepting connections`.

## 3. Crear la base de rendimiento

Este paso se hace una sola vez:

```cmd
docker --host npipe:////./pipe/dockerDesktopLinuxEngine exec almacen-e2e createdb -U postgres almacen_rendimiento
```

Si responde que la base **ya existe**, continuá con el siguiente paso. La base `almacen_rendimiento` es distinta de `almacen`, que se utiliza para e2e.

La conexión que usan los comandos de rendimiento es:

| Campo | Valor |
|---|---|
| Host | `127.0.0.1` |
| Puerto en Windows | `54329` |
| Base | `almacen_rendimiento` |
| Usuario | `postgres` |
| Contraseña local de prueba | `postgres` |

## 4. Ejecutar el seed de Prisma

Desde CMD, en la carpeta del proyecto:

```cmd
npm run db:seed:rendimiento
```

Ese comando realiza dos tareas, en orden:

1. Aplica las migraciones existentes mediante la configuración exclusiva de rendimiento. Esto crea las tablas y el índice `pg_trgm`.
2. Ejecuta `prisma/seedRendimiento.ts`, que inserta los productos con Prisma `createMany`, en lotes de 1.000.

Esperá a que termine. Durante la carga muestra avances cada 10.000 productos. En una primera ejecución sobre una base vacía, la salida final esperada es:

```text
Seed local finalizado: { insertados: 200000, total: 200000, activos: 180000 }
```

**Los productos quedan guardados.** El seed se puede repetir: omite los códigos de barras que ya existen. En ese caso `insertados` puede ser cero, pero `total` debería seguir siendo 200.000.

Si aparece un error, revisalo antes de continuar. El paso de medición requiere que la carga haya terminado.

## 5. Comprobar la cantidad y ver productos desde CMD

Este comando hace la consulta directamente dentro del contenedor y vuelve a CMD:

```cmd
docker --host npipe:////./pipe/dockerDesktopLinuxEngine exec almacen-e2e psql -U postgres -d almacen_rendimiento -c "SELECT COUNT(*) AS total_productos FROM public.producto;"
```

El resultado esperado es **200000**.

Para ver 20 productos:

```cmd
docker --host npipe:////./pipe/dockerDesktopLinuxEngine exec almacen-e2e psql -U postgres -d almacen_rendimiento -c "SELECT id, nombre, codigobarra, preciolista, activo FROM public.producto ORDER BY id LIMIT 20;"
```

La tabla se llama **`public.producto`**, en singular.

## 6. Ver los datos con Prisma Studio

Desde otra ventana de CMD, en la misma carpeta del proyecto:

```cmd
npm run db:studio:rendimiento
```

Dejá esa terminal abierta. En el navegador, elegí el modelo **`producto`** para consultar los registros. Para detener Studio, volvé a esa terminal y presioná `Ctrl+C`.

## 7. Medir el índice

Con el seed terminado, ejecutá desde CMD:

```cmd
npm run db:medir:rendimiento
```

Compara las búsquedas con y sin el índice usando `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)` a través de Prisma. Hace una ejecución de calentamiento y cinco muestras por caso y escenario.

Al terminar genera:

- `docs/rendimiento.md`: informe con los tiempos reales de esta ejecución.
- `docs/rendimiento-prisma.json`: muestras individuales y planes completos.

La transacción de medición se deshace para restaurar el índice original. **Los productos del seed se conservan**, porque ya estaban confirmados antes de medir.

## Resolver errores frecuentes

| Mensaje o situación | Qué revisar |
|---|---|
| `relation "public.productos" does not exist` | Usar `public.producto`, en singular. |
| `relation "public.producto" does not exist` | Ejecutar el paso 4 y confirmar que termina correctamente; consultar la base `almacen_rendimiento`. |
| `database "almacen_rendimiento" does not exist` | Ejecutar el paso 3. |
| `P1001: Can't reach database server` | Verificar Docker Desktop, contenedor iniciado y puerto publicado `54329`. |
| `container ... is not running` | Arrancar `almacen-e2e` con el paso 2. |
| `database ... already exists` | La base ya está creada; continuar con el seed. |
| `npm` no se reconoce | Instalar o habilitar Node.js y npm; abrir de nuevo CMD. |
| `prisma` o `tsx` no se reconoce desde los comandos npm | Ejecutar `npm install` en la raíz del proyecto y volver al paso 4. |
| Prisma Client no está generado | Ejecutar `npx prisma generate --config prisma/rendimiento.config.ts` y repetir el paso 4. |
| La base contiene productos ajenos al seed | Usar una base exclusiva para rendimiento; el seed se detiene para no mezclar datos. |

Si estás dentro de `psql`, estos comandos permiten comprobar la conexión y listar las tablas:

```text
\conninfo
\dt public.*
```

Para volver a CMD:

```text
\q
```
