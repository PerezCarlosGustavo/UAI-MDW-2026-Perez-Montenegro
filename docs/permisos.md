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

### PENDIENTE
- Es el rol con el que entra cualquiera que se loguea por primera vez (la URL es pública).
- No tiene ningún permiso: todos los endpoints le responden 403 y la home le muestra que su cuenta espera aprobación.
- Un ADMIN le asigna VENDEDOR (o lo desactiva) desde `/usuarios`.

### Cómo se asignan los roles
- El primer ADMIN se crea con `ADMIN_EMAIL` en el seed.
- Todos los demás cambios de rol los hace un ADMIN desde el ABM de usuarios.
- Un ADMIN no puede quitarse el rol ni desactivarse a sí mismo (409), para que el sistema nunca quede sin nadie que apruebe usuarios.

## 2. Matriz de permisos
```ts
{
  producto: {
    crear: ["ADMIN"],
    editar: ["ADMIN"],
    borrar: ["ADMIN"],
    ver: ["ADMIN", "VENDEDOR"]
  },
  cliente: {
    crear: ["ADMIN", "VENDEDOR"],
    editar: ["ADMIN"],
    borrar: ["ADMIN"],
    ver: ["ADMIN", "VENDEDOR"]
  },
  venta: {
    crear: ["ADMIN", "VENDEDOR"],
    ver: ["ADMIN", "VENDEDOR"]
  },
  cuentacorriente: {
    ver: ["ADMIN", "VENDEDOR"],
    cobrar: ["ADMIN", "VENDEDOR"]
  },
  usuario: {
    ver: ["ADMIN"],
    editar: ["ADMIN"]
  }
}
```
## 3. Pertenencia
- VENDEDOR solo puede ver sus ventas
- ADMIN puede ver todas
- Implementado en `GET /api/ventas`, `GET /api/ventas/:id` y `GET /api/ventas/mias`, con `filtroVentasVisiblesPara` (`lib/venta/pertenencia.ts`): el id de la sesión va dentro del WHERE, no en un `if` posterior
- Si un vendedor intenta acceder a una venta que no es suya → 404 (no pertenece)
- ADMIN y VENDEDOR pueden consultar deuda y registrar cobranzas en cuenta corriente.

## 4. Errores de autorización
### 401 — No autenticado
El usuario no inició sesión.

### 403 — No autorizado
El usuario inició sesión pero no tiene el rol adecuado.

### 404 — No pertenece al usuario
El recurso existe, pero no pertenece al usuario autenticado.