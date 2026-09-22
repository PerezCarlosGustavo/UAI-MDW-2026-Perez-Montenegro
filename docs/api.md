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
```json
{ "ok": true }
```
### Errores
- 404 → Producto inexistente
- 400 → Validación de forma
- 409 → Reglas de negocio

# 3. Categorías
## GET /api/categorias
Roles: ADMIN ✓ / VENDEDOR ✓

## POST /api/categorias
Roles: ADMIN ✓

## PUT /api/categorias/:id
Roles: ADMIN ✓

# 4. Clientes
## GET /api/clientes
Roles: ADMIN ✓ / VENDEDOR ✓

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

# 5. Ventas
## GET/api/ventas
Lista todas las ventas.

### Roles
- ADMIN ✓
- VENDEDOR ✓
(VENDEDOR ve todas, pero para ver solo las propias existe /mias)

GET /api/ventas/mias
Lista solo las ventas del vendedor autenticado.

Roles
- VENDEDOR ✓
- ADMIN ✗ → 403

## POST/api/ventas
Registra una venta.

### Roles
- ADMIN ✓
- VENDEDOR ✓

### Body
```json
{
  "clienteid": 12,
  "tipopago": 0,
  "total": 1500,
  "detalles": [
    { "productoid": 1,
      "cantidad": 2,
      "preciounitario": 750,
      "subtotal": 1500
    }
  ]
}
```
### Reglas de negocio
- Cliente debe existir (si se envía)
- Producto debe existir y estar activo
- Cantidad > 0
- Precio unitario > 0
- Subtotal coherente
- Total = suma de subtotales
- Si permitestock = true → descuenta stock
- Stock insuficiente → 409
- VENDEDOR solo crea ventas propias
- ADMIN puede crear ventas para cualquiera

### Respuesta 201
```json
{ "id": 88 }
```
### Errores
- 400 → Validación de forma
- 404 → Cliente o producto inexistente
- 409 → Reglas de negocio (stock, totales, etc.)

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
|GET /api/clientes|✓|✓|✗|
|POST /api/clientes|✓|✓|✗|
|PUT /api/clientes/:id|✓|✓|✗|
|GET /api/ventas|✓|✓|✗|
|GET /api/ventas/mias|✓|✓|✗|
|POST /api/ventas|✓|✓|✗|
|POST /api/cuentacorriente/:id/movimientos|✓|✓|✗|
|POST /api/cobranza|✓|✓|✗|