# 📘 ADR 0008 — Base de datos y modelado
**Estado:** Aprobado

**Fecha:** 2026-10-03

**Decide:** Equipo MDW — Carlos Gustavo Perez / Leandro Montenegro

## 🎯 Contexto
El sistema guarda ventas con varias líneas de productos, descuenta stock, lleva cuentas corrientes en unidades (ADR 0002) y cobra por FIFO. Eso exige:
- relaciones fuertes entre entidades (una venta tiene muchos productos y un producto está en muchas ventas, con cantidad y precio propios en cada caso);
- operaciones que tienen que ser **todo o nada**: la venta, el descuento de stock y la deuda; o la cobranza con todos sus movimientos;
- importes en pesos sin errores de redondeo;
- que no se pueda perder historia: las ventas son inmutables (ADR 0006) y la deuda se reconstruye desde los movimientos.

Además, el modelo arranca del sistema de escritorio que usaba el comercio: tablas en minúscula, ids numéricos y nombres de restricciones propios (`pk_`, `fk_`, `uq_`, `ix_`).

## 🧩 Opciones consideradas

### Motor de base de datos
|Opción|A favor|En contra|
|------|-------|---------|
|A. PostgreSQL (Supabase) + Prisma|Relacional, transacciones, claves foráneas y `DECIMAL` exacto. Es el stack de la materia. Migraciones versionadas con Prisma|Hay que pensar el modelo antes; los cambios de schema requieren migración|
|B. MongoDB Atlas + Prisma|Esquema flexible|La relación N‑N venta–producto y la integridad (que no exista una venta de un producto borrado) quedan a cargo del código. Las transacciones entre colecciones son más limitadas|

### Cómo guardar la cuenta corriente
|Opción|A favor|En contra|
|------|-------|---------|
|A. Una fila por producto fiado con `estado` (PENDIENTE/PAGADO) y `precioPagado`, como decía la spec original|Se ve directo qué está pagado|Pagar es *modificar* filas: se pierde cómo se llegó al estado actual, y el saldo a favor queda en otro lado (un campo en `cliente`)|
|B. **Historial de movimientos** (`cuentacorrientemovimiento`): deuda, producto liquidado, pago recibido, saldo a favor generado y usado|Nada se modifica ni se borra: la deuda y el saldo a favor se **calculan** desde los movimientos. Queda la historia completa de cada cobro|Para saber la deuda hay que recorrer los movimientos; la lógica de cálculo es más compleja (`reconstruirPendientes`, `calcularFIFO`)|

### Cómo dar de baja productos y clientes
|Opción|A favor|En contra|
|------|-------|---------|
|A. Borrado físico (`DELETE`)|Simple|Rompe las ventas y la cuenta corriente que los referencian; las FK lo impiden (`onDelete: NoAction`)|
|B. **Baja lógica** (`activo = false`)|Las ventas viejas siguen mostrando qué se vendió; se puede reactivar|Hay que filtrar los inactivos en las consultas y en las reglas|

## ✅ Decisión
- **PostgreSQL en Supabase, con Prisma** y migraciones versionadas en `prisma/migrations`.
- **Cuenta corriente como historial de movimientos** (opción B). Los tipos están en `lib/reglas/tiposMovimientoCuentaCorriente.ts` (1 = deuda por venta, 2 = saldo a favor, 3 = producto liquidado, 4 = saldo a favor usado, 5 = pago recibido) y el schema de Zod solo acepta esos valores.
- **Baja lógica** para productos y clientes. Las ventas no se borran nunca.

### Cómo quedó el modelo
- **7 entidades del dominio** + `usuario`: `categoria`, `producto`, `cliente`, `venta`, `detalleventa`, `cuentacorriente`, `cuentacorrientemovimiento`.
- **1‑N:** categoría → productos, cliente → ventas, usuario → ventas, cuenta corriente → movimientos.
- **1‑1:** cliente → cuenta corriente (`uq_cuentacorriente_cliente`). Se crea sola con la primera venta fiada.
- **N‑N:** venta ↔ producto, resuelta con **`detalleventa`**, que tiene datos propios: cantidad, precio unitario y subtotal **congelados al momento de la venta**. Si mañana cambia el precio de lista, la venta de ayer no cambia.
- **Importes** en `DECIMAL(12,2)` y **cantidades** en `DECIMAL(12,3)` (los productos pesables se venden por fracción). Nunca `float` para plata.
- **Restricciones:** únicos en `categoria.nombre`, `producto.codigobarra`, `cliente.documento`, `usuario.email`; índices en las FK y en las fechas de venta y movimiento, que son las columnas por las que se busca.
- **Rol** como `enum` de Postgres (ADMIN, VENDEDOR, PENDIENTE): la base rechaza cualquier otro valor (ADR 0007).

## 📌 Consecuencias
### ✔ Lo que se vuelve más fácil
- La venta, el stock y la deuda se guardan en **una transacción**: si algo falla, no queda nada a medias.
- La cobranza bloquea la cuenta del cliente (`SELECT … FOR UPDATE`): dos cobros simultáneos no se pisan.
- La base garantiza la integridad aunque el código tenga un error: no se puede vender un producto inexistente ni borrar uno que tiene ventas.
- Se puede auditar cualquier cuenta corriente: cada cobro deja sus movimientos.

### ❗ Lo que se vuelve más difícil
- `tipo` de movimiento es un `Int` en la base y los valores válidos se controlan en el código (constantes + Zod). Una inserción a mano en la base podría meter un tipo inválido.
- Calcular la deuda recorre todos los movimientos del cliente. Con el volumen de un almacén no pesa.
- **La base de desarrollo y la de producción son la misma** (un solo proyecto de Supabase). Es lo más simple para el equipo, pero lo que se prueba en local aparece en la URL pública, y un `prisma migrate dev` o `migrate reset` mal usado puede borrar datos reales. Por eso las migraciones se aplican con `prisma migrate deploy` y nunca con `reset`.

### 🔄 Qué habría que revisar si cambia el contexto
- Antes de tener datos reales de un comercio: **separar la base de desarrollo** (otro proyecto de Supabase o un Postgres local).
- Si crece el volumen de movimientos: guardar un saldo calculado por cuenta (y recalcularlo en la misma transacción) en vez de recorrer todo.
- Pasar `tipo` a un `enum` de Postgres o a un `CHECK` para que la base también lo valide.
