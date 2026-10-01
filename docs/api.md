# API del Sistema de Gestión Comercial
Versión: 1.0  
Autenticación: OAuth (Auth.js)  
Roles: `ADMIN`, `VENDEDOR`  
Formato: JSON  

---

# 1. Autenticación

## GET /api/auth/session
Devuelve el usuario autenticado.

### Respuesta 200
```json
{
  "id": 12,
  "email": "juan@gmail.com",
  "nombre": "Juan Pérez",
  "rol": "VENDEDOR"
}
```

### Errores
401 → No autenticado

# 2. Productos
## GET /api/productos
Lista productos activos.

### Roles
- ADMIN ✓
- VENDEDOR ✓
- Sin sesión ✗ → 401

### Respuesta 200
```json
[
  {
    "id": 1,
    "categoriaid": 2,
    "nombre": "Coca Cola 2.25L",
    "codigobarra": "7790895000251",
    "preciolista": 2500,
    "permitestock": true,
    "stockactual": 12,
    "activo": true
  }
]
```
## POST /api/productos
Crea un producto.

### Roles
- ADMIN ✓
 - VENDEDOR ✗ → 403
- Sin sesión ✗ → 401

### Body
```json
{
  "categoriaid": 2,
  "nombre": "Pepsi 2.25L",
  "codigobarra": "7790895000252",
  "preciolista": 2400,
  "permitestock": true,
  "stockactual": 20,
  "activo": true
}
```
### Respuesta 201

```json
{ "id": 15 }
```
### Errores
- 400 → Validación Zod
- 409 → Reglas de negocio (stock, categoría inexistente, etc.)
- 409 → Código de barras duplicado

## PUT /api/productos/:id
Actualiza un producto.

### Roles
- ADMIN ✓
- VENDEDOR ✗ → 403

### Body
```json
{
  "preciolista": 2600,
  "activo": true
}
```
### Respuesta 200
El producto actualizado.

### Errores
- 404 → Producto inexistente
- 400 → Validación de forma
- 409 → Reglas de negocio

## GET /api/productos/:id
Un producto (activo o no).

### Roles
- ADMIN ✓
- VENDEDOR ✓

### Errores
- 400 → id no numérico
- 404 → Producto inexistente

## DELETE /api/productos/:id
Baja lógica: pone `activo = false`. El producto deja de aparecer en el catálogo y no se puede vender, pero la fila queda porque hay ventas que lo referencian.

### Roles
- ADMIN ✓
- VENDEDOR ✗ → 403

### Respuesta 200
El producto con `activo: false`.

### Errores
- 404 → Producto inexistente

# 3. Categorías
## GET /api/categorias
Roles: ADMIN ✓ / VENDEDOR ✓

## POST /api/categorias
Roles: ADMIN ✓

## PUT /api/categorias/:id
Roles: ADMIN ✓

# 4. Clientes
## GET /api/clientes
Clientes activos, ordenados por nombre (máximo 200).

Roles: ADMIN ✓ / VENDEDOR ✓

## GET /api/clientes/:id
Un cliente (activo o no).

Roles: ADMIN ✓ / VENDEDOR ✓

### Errores
- 400 → id no numérico
- 404 → Cliente inexistente

## POST /api/clientes
Roles: ADMIN ✓ / VENDEDOR ✓

###Body
```json
{
  "nombre": "Carlos López",
  "documento": "30123456",
  "telefono": "3415551234"
  "activo": true
}
```
### Errores
- 400 → Validación de forma
- 409 → Documento duplicado
- 409 → Reglas de negocio (cliente inactivo con movimientos, etc.)

## PUT/api/clientes/:id
Roles: ADMIN ✓

### Errores
- 404 → Cliente inexistente
- 409 → Documento duplicado
- 409 → No se puede desactivar cliente con movimientos

## DELETE /api/clientes/:id
Baja lógica: pone `activo = false`. El cliente no puede comprar, pero la fila queda por sus ventas y su cuenta corriente.

Roles: ADMIN ✓ / VENDEDOR ✗ → 403

### Errores
- 404 → Cliente inexistente
- 409 → El cliente tiene movimientos en cuenta corriente

# 5. Ventas
## GET /api/ventas
Lista las ventas que el usuario puede ver, de a 50, las más nuevas primero. Paginación con `?pagina=N` (empieza en 1).

### Roles y pertenencia
- ADMIN ✓ → ve todas
- VENDEDOR ✓ → ve **solo las que registró él** (el id de la sesión va en el WHERE)
- Sin sesión ✗ → 401

### Errores
- 400 → `pagina` inválida

## GET /api/ventas/:id
Una venta con su detalle.

- ADMIN: cualquier venta.
- VENDEDOR: solo las suyas. Una venta de otro vendedor responde **404**, igual que si no existiera (403 confirmaría que existe).

## GET /api/ventas/mias
Las ventas del vendedor autenticado. Para un VENDEDOR es lo mismo que `GET /api/ventas`.

Roles
- VENDEDOR ✓
- ADMIN ✗ → 403

## POST /api/ventas
Registra una venta. El usuario de la venta sale de la sesión.

### Roles
- ADMIN ✓
- VENDEDOR ✓

### Body
Solo producto y cantidad. **El precio, el subtotal y el total los calcula el servidor** con el precio de lista del catálogo; si el body trae esos campos, se ignoran.
```json
{
  "clienteid": 12,
  "tipopago": 0,
  "detalles": [
    { "productoid": 1, "cantidad": 2 }
  ]
}
```
`tipopago`: 0 = contado, 1 = cuenta corriente.

### Reglas de negocio
- Cliente debe existir y estar activo (si se envía)
- Producto debe existir y estar activo
- Precio unitario = `preciolista` del producto
- Solo se descuenta stock de productos con `permitestock = true`
- **Stock insuficiente no bloquea la venta** (ADR 0004): el stock queda negativo y la respuesta trae una advertencia
- La venta y el descuento de stock se guardan en una sola transacción

### Respuesta 201
La venta creada, con `advertencias` (vacío si no hubo problemas de stock):
```json
{
  "id": 88,
  "total": 5000,
  "detalleventa": [{ "productoid": 1, "cantidad": 2, "preciounitario": 2500, "subtotal": 5000 }],
  "advertencias": ["Stock insuficiente para GASEOSA: había 1 y se vendieron 2. El stock queda en negativo, hay que ajustarlo."]
}
```
### Errores
- 400 → Validación de forma (sin productos, cantidad ≤ 0, tipopago distinto de 0/1)
- 409 → Cliente o producto inexistente o inactivo

# 6. Cuenta Corriente
## GET/api/cuentacorriente/:clienteid
Devuelve movimientos pendientes y saldo a favor.

### Roles
- ADMIN ✓
- VENDEDOR ✓

### Respuesta 200
```json
{
  "clienteid": 12,
  "pendientes": [
    { "productoid": 1, "cantidad": 2, "fecha": "2024-09-01" }
  ],
  "saldoAFavor": 500
}
```
# 7. Movimientos (Fiado)
## POST /api/cuentacorriente/:clienteid/movimientos
Registra ítems fiados.

### Roles
- ADMIN ✓
- VENDEDOR ✓

### Body
```json
{
  "ventaid": 88,
  "items": [
    { "productoid": 1, "cantidad": 2 },
    { "productoid": 5, "cantidad": 1 }
  ]
}
```

### Errores
- 404 → Cliente inexistente
- 409 → Venta fiada sin cliente

# 8. Cobranza FIFO
## POST /api/cobranza
Liquida deuda por monto entregado.

### Roles
- ADMIN ✓
- VENDEDOR ✓

### Body
```json
{
  "clienteid": 12,
  "monto": 5000
}
```

### Reglas de negocio
- FIFO estricto
- No fraccionar productos
- Si no alcanza → todo va a saldoAFavor
- Si sobra → saldoAFavor

### Respuesta 200
```json
{
  "pagados": [
    { "productoid": 1, "cantidad": 2, "precioPagado": 3000 }
  ],
  "saldoAFavor": 2000
}
```

# 8b. Usuarios (ABM, solo ADMIN)
Quien entra por primera vez con Google queda con rol `PENDIENTE` y no puede usar ningún endpoint (403) hasta que un ADMIN le asigne un rol desde acá.

## GET /api/usuarios
Lista usuarios (máximo 50, los más nuevos primero).

Query opcional: `?rol=PENDIENTE` (o `ADMIN`, `VENDEDOR`).

### Roles
- ADMIN ✓
- VENDEDOR / PENDIENTE ✗ → 403
- Sin sesión ✗ → 401

### Respuesta 200
```json
[
  { "id": 4, "nombre": "Juana", "email": "juana@gmail.com", "rol": "PENDIENTE", "activo": true }
]
```
### Errores
- 400 → rol inválido en la query

## PATCH /api/usuarios/:id
Asigna rol y/o activa/desactiva un usuario. Solo se pueden mandar `rol` y `activo`.

### Body
```json
{ "rol": "VENDEDOR", "activo": true }
```
### Respuesta 200
El usuario actualizado (mismo formato que en la lista).

### Errores
- 400 → body vacío, rol inexistente o campos que no se pueden cambiar (ej. `email`)
- 403 → quien llama no es ADMIN
- 404 → el usuario no existe
- 409 → un ADMIN intenta quitarse el rol o desactivarse a sí mismo

# 9. Errores globales
### 400 — Error de validación
```json
{
  "error": "Validación fallida",
  "detalles": { "campo": "El nombre es obligatorio" }
}
```
### 401 — No autenticado
```json
{ "error": "No autenticado" }
```
### 403 — No autorizado
```json
{ "error": "No autorizado" }
```
### 404 — No encontrado
```json
{ "error": "Recurso inexistente" }
```
### 409 — Regla de negocio
```json
{
  "error": "Regla de negocio",
  "detalles": "stock insuficiente"
}
```
# 10. Matriz de permisos
| Endpoint	| ADMIN | VENDEDOR |	Sin sesión |
|-----------|-------|----------|-------------|
|GET /api/productos|✓|✓|✗|
|POST /api/productos|✓|✗|✗|
|PUT /api/productos/:id|✓|✗|✗|
|GET /api/productos/:id|✓|✓|✗|
|DELETE /api/productos/:id|✓|✗|✗|
|GET /api/clientes|✓|✓|✗|
|POST /api/clientes|✓|✓|✗|
|PUT /api/clientes/:id|✓|✗|✗|
|GET /api/clientes/:id|✓|✓|✗|
|DELETE /api/clientes/:id|✓|✗|✗|
|GET /api/ventas|✓|✓|✗|
|GET /api/ventas/mias|✓|✓|✗|
|POST /api/ventas|✓|✓|✗|
|POST /api/cuentacorriente/:id/movimientos|✓|✓|✗|
|POST /api/cobranza|✓|✓|✗|
|GET /api/usuarios|✓|✗|✗|
|PATCH /api/usuarios/:id|✓|✗|✗|

El rol `PENDIENTE` no tiene acceso a ningún endpoint (403 en todos).