# 📘 ADR 0003 — Autorización y Pertenencia en el Sistema
**Estado:** Aprobado

**Fecha:** 2026-09-22

**Decide:** Equipo MDW — Carlos Gustavo Perez / Leandro Montenegro

## 🎯 Contexto
El sistema requiere:
- **Roles:** ADMIN y VENDEDOR
- **Permisos diferenciados:** CRUD completo vs. acciones restringidas
- **Pertenencia:** un vendedor solo puede ver sus propias ventas
- **Autenticación:** OAuth con Auth.js
- **Autorización en servidor:** evitar que el frontend decida permisos
- **Errores consistentes:** 401 (no autenticado), 403 (no autorizado), 404 (no pertenece)

La duda técnica fue cómo implementar la autorización de forma:
- segura,
- centralizada,
- fácil de mantener,
- compatible con App Router,
- y alineada con la cátedra (Clase 6).

Se evaluaron distintas formas de manejar roles, permisos y pertenencia.

## 🧩 Opciones consideradas
|Opción|A favor|En contra|
|------|-------|---------|
|A. Validar permisos en el frontend|Fácil de implementar-Inseguro, manipulable, no cumple Clase 6|
|B. Validar permisos directamente en cada endpoint|Simple, explícito|Lógica duplicada, difícil de mantener|
|C. Middleware global de autorización|Centralizado|App Router no soporta middleware con acceso a sesión|
|D. Funciones reutilizables: `requerirUsuario()` + `verificarPermiso()` + pertenencia por endpoint|Centralizado, seguro, fácil de mantener, recomendado por la cátedra|Requiere diseño inicial más cuidadoso|


## ✅ Decisión
Elegimos **Opción D — Funciones de autorización reutilizables en servidor:**
- `requerirUsuario()`
- `verificarPermiso(recurso, accion)`
- `verificarPertenencia() (según endpoint)`

Porque centraliza la lógica, evita duplicación, es segura y cumple exactamente con Clase 6.

## 📌 Consecuencias
### ✔ Lo que se vuelve más fácil
- Todos los endpoints tienen autorización consistente.
- La matriz de permisos vive en un solo archivo.
- Los roles se validan en servidor, no en cliente.
- La pertenencia se implementa claramente en /api/ventas/mias.
- Los errores 401/403/404 se unifican.
- El código es más mantenible y escalable.

###❗ Lo que se vuelve más difícil
- Requiere disciplina: ningún endpoint puede omitir verificarPermiso().
- El frontend no puede asumir permisos; debe consultar al servidor.
- La pertenencia debe implementarse manualmente en cada recurso que lo requiera.

### 🔄 Qué habría que revisar si cambia el contexto
- Si se agregan más roles (por ejemplo, “Supervisor”), habría que extender la matriz de permisos.
- Si se agregan sucursales, la pertenencia debería incluir sucursalId.
- Si se agrega facturación electrónica, algunos endpoints podrían requerir permisos adicionales.

## 🧱 Implementación final adoptada
### 1. Matriz de permisos centralizada
```ts
export const permisos = {
  producto: {
    crear: ["ADMIN"],
    editar: ["ADMIN"],
    ver: ["ADMIN", "VENDEDOR"],
  },
  cliente: {
    crear: ["ADMIN", "VENDEDOR"],
    editar: ["ADMIN"],
    ver: ["ADMIN", "VENDEDOR"],
  },
  venta: {
    crear: ["ADMIN", "VENDEDOR"],
    ver: ["ADMIN", "VENDEDOR"],
  },
};
```
### 2. `Función requerirUsuario()`
- Devuelve el usuario autenticado
- Lanza 401 si no hay sesión
- Lanza 403 si el rol no coincide con el requerido

### 3. `Función verificarPermiso(recurso, accion)`
- Valida contra la matriz
- Lanza 403 si el rol no está autorizado

4. Pertenencia en ventas
- `/api/ventas` → ADMIN y VENDEDOR ven todas
- `/api/ventas/mias` → solo VENDEDOR
- `/api/ventas/[id]` → si VENDEDOR intenta ver una venta ajena → 404

5. Errores unificados
- 401 → no autenticado
- 403 → no autorizado
- 404 → no pertenece o no existe
- 409 → regla de negocio