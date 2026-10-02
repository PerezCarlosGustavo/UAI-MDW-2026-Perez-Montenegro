# Reglas de Negocio del Sistema de Gestión Comercial
Versión: 1.0

Este documento describe todas las validaciones de forma y reglas de negocio aplicadas en los recursos del sistema, según lo requerido en Clase 5 de la cátedra.

## 1. Productos
### Validaciones de forma (400)
- nombre obligatorio
- categoriaid obligatorio
- preciolista ≥ 0
- stockactual ≥ 0

### Reglas de negocio (409)
- La categoría debe existir
- Si permitestock = false → stockactual debe ser 0
- Producto inactivo (activo = false) no puede usarse en ventas
- Código de barras debe ser único (Prisma lo valida, pero se captura el error)

## 2. Clientes
### Validaciones de forma (400)
- nombre obligatorio
- documento opcional pero si viene debe ser válido
- telefono opcional pero si viene debe ser válido

### Reglas de negocio (409)
- documento debe ser único
- Cliente inactivo no puede asociarse a ventas nuevas
- Cliente inactivo no puede tener movimientos de cuenta corriente
- No se puede desactivar un cliente con movimientos pendientes

## 3. Ventas
### Validaciones de forma (400) — `lib/schemas/venta.ts`
- Debe tener al menos un producto
- tipopago obligatorio: 0 (contado) o 1 (cuenta corriente)
- cantidad > 0
- El cliente solo manda producto y cantidad; precio, subtotal y total no se aceptan del body

### Reglas de negocio (409) — `lib/venta/reglas.ts` (función pura, con tests)
- Cliente debe existir y estar activo (si se envía)
- Producto debe existir y estar activo
- El precio unitario es el `preciolista` del catálogo al momento de la venta
- Solo se descuenta stock si `permitestock = true`
- Stock insuficiente NO bloquea la venta (ADR 0004): queda negativo y se devuelve una advertencia
- La venta y el descuento de stock van en una transacción
- La venta queda siempre a nombre del usuario de la sesión

### Pertenencia
- VENDEDOR solo ve sus ventas; ADMIN ve todas (ver `docs/permisos.md`)

## 4. Cuenta Corriente
### Reglas de negocio (409)
- Venta fiada requiere cliente
- FIFO estricto en cobranza
- No se pueden fraccionar productos
- Si el monto no alcanza → todo va a saldoAFavor
- Si sobra → saldoAFavor

### Tipos de movimiento del ledger
- `1`: deuda originada por una venta; conserva producto, venta y cantidad, sin congelar precio.
- `2`: saldo a favor generado.
- `3`: producto liquidado; referencia la venta original y conserva cantidad e importe pagados.
- `4`: saldo a favor anterior utilizado en una cobranza.
- `5`: importe recibido en una cobranza, como registro de auditoría.