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
### Validaciones de forma (400)
- Debe tener al menos un detalle
- tipopago obligatorio
- cantidad > 0
- preciounitario > 0
- subtotal > 0
- total > 0

### Reglas de negocio (409)
- Cliente debe existir (si se envía)
- Producto debe existir
- Producto debe estar activo
- Subtotal debe ser coherente: cantidad * preciounitario
- Total debe ser la suma de subtotales
- Si permitestock = true → stock debe ser suficiente
- Stock se descuenta al confirmar la venta
- VENDEDOR solo puede crear ventas propias
- ADMIN puede crear ventas para cualquier usuario

## 4. Cuenta Corriente
### Reglas de negocio (409)
- Venta fiada requiere cliente
- FIFO estricto en cobranza
- No se pueden fraccionar productos
- Si el monto no alcanza → todo va a saldoAFavor
- Si sobra → saldoAFavor