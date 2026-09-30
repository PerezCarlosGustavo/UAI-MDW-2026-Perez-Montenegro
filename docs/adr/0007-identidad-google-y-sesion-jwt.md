# 📘 ADR 0007 — Login con Google y sesión en token (JWT)
**Estado:** Aprobado

**Fecha:** 2026-09-30

**Decide:** Equipo MDW — Carlos Gustavo Perez / Leandro Montenegro

## 🎯 Contexto
Clase 6 pide resolver dos cosas por separado:
1. **Quién sos** (autenticación): cómo prueba alguien que es quien dice ser.
2. **Dónde vive la sesión**: en un token que viaja en la cookie, o en una tabla de la base.

En la spec original (H1) habíamos puesto login con email y contraseña. Eso nos obligaba a guardar contraseñas, hashearlas, resolver "me olvidé la contraseña", etc. Para un almacén de barrio con dos o tres personas usando el sistema no suma nada.

## 🧩 Opciones consideradas

### Proveedor de identidad
|Opción|A favor|En contra|
|------|-------|---------|
|A. Email + contraseña propios|No depende de nadie|Hay que guardar y proteger contraseñas, recuperar cuentas, etc. Es la parte más fácil de hacer mal|
|B. Google (OAuth) con Auth.js|No guardamos contraseñas. Todos los que usan el sistema tienen Gmail|Si Google no responde, no se puede entrar. Hay que registrar cada URL en Google Cloud|

### Dónde vive la sesión
|Opción|A favor|En contra|
|------|-------|---------|
|A. Sesión en base (tabla `Session`, adapter de Prisma)|Se puede cerrar la sesión de alguien desde la base|Más tablas y una consulta por request igual|
|B. JWT con el rol congelado al entrar|Cero consultas para saber quién llama|El rol es una foto: si cambia, la persona tiene que volver a entrar|
|C. JWT, pero el rol se lee de la base en cada request|No hace falta tabla de sesiones y el rol siempre está actualizado|Una consulta chica por request|

## ✅ Decisión
- **Proveedor: Google (opción B).** Quién sos lo resuelve Google; **qué sos** (ADMIN o VENDEDOR) lo decide nuestra tabla `usuario`.
- **Sesión: JWT, leyendo el rol de la base en cada request (opción C).**

Elegimos C porque en nuestro caso el dueño puede promover o desactivar a un vendedor, y queremos que eso tenga efecto enseguida. Con el volumen del almacén (un puñado de requests por minuto), la consulta extra no pesa.

## 📌 Consecuencias
### ✔ Lo que se vuelve más fácil
- No hay contraseñas en nuestra base.
- Todo usuario nuevo entra como VENDEDOR. El upsert del `signIn` nunca pisa el rol, así que nadie puede darse ADMIN a sí mismo desde la API.
- Si desactivamos a un usuario (`activo = false`) o lo borramos, en el siguiente request deja de estar autenticado (401).
- ADMIN se asigna desde la base: `ADMIN_EMAIL` en el seed.

### ❗ Lo que se vuelve más difícil
- Cada URL nueva (producción, otro dominio) hay que registrarla en Google Cloud Console. Los preview deployments de Vercel no sirven para probar el login, porque cambian de URL.
- Si Google no responde, nadie puede entrar.
- Hay una consulta a `usuario` por cada request autenticado.

### 🔄 Qué habría que revisar si cambia el contexto
- Si el sistema tuviera mucho tráfico, conviene congelar el rol en el token (opción B) y aceptar que un cambio de rol requiera volver a entrar.
- Si aparecen usuarios sin cuenta de Google, habría que sumar otro proveedor (por ejemplo, magic link por email).
