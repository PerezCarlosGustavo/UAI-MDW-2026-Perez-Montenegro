# Permisos, Roles y Autorización
Versión: 1.0

Este documento describe la matriz de permisos, los roles del sistema, y las reglas de pertenencia, según lo requerido en Clase 6.

## 1. Roles
### ADMIN
- Acceso total
- CRUD completo de productos
- CRUD completo de clientes
- CRUD completo de ventas
- Puede ver todas las ventas
- Puede operar cuenta corriente

### VENDEDOR
- Puede crear clientes
- Puede crear ventas
- Puede ver productos
- Puede ver clientes
- Puede ver solo sus ventas
- No puede editar productos
- No puede editar clientes
- No puede eliminar recursos

## 2. Matriz de permisos
```ts
{
  producto: {
    crear: ["ADMIN"],
    editar: ["ADMIN"],
    ver: ["ADMIN", "VENDEDOR"]
  },
  cliente: {
    crear: ["ADMIN", "VENDEDOR"],
    editar: ["ADMIN"],
    ver: ["ADMIN", "VENDEDOR"]
  },
  venta: {
    crear: ["ADMIN", "VENDEDOR"],
    ver: ["ADMIN", "VENDEDOR"]
  }
}
```
## 3. Pertenencia
- VENDEDOR solo puede ver sus ventas
- ADMIN puede ver todas
- Implementado en /api/ventas/mias
- Si un vendedor intenta acceder a una venta que no es suya → 404 (no pertenece)

## 4. Errores de autorización
### 401 — No autenticado
El usuario no inició sesión.

### 403 — No autorizado
El usuario inició sesión pero no tiene el rol adecuado.

### 404 — No pertenece al usuario
El recurso existe, pero no pertenece al usuario autenticado.