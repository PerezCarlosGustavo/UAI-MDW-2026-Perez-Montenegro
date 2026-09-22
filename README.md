# 📘 Proyecto MDW 2026 — Almacén POS
Sistema de Punto de Venta, Inventario y Cuentas Corrientes (FIFO)
> Sistema web de gestión comercial para comercios de barrio, con ventas al contado y fiado, control de stock, cuenta corriente y cobranza FIFO estricta.

**👥 Equipo**

- Carlos Gustavo Perez — responsable del repositorio (Vercel)
- Leandro Jonatan Montenegro


**Producción:** https://almacen-pos.vercel.app  
**🎯 Problema que resuelve**

Los comercios de barrio pierden capital por:
- registrar ventas en cuadernos sin control,
- fiar en pesos sin indexación,
- no controlar stock,
- no registrar precios pagados,
- no aplicar FIFO en cobranzas.

Este sistema:
- registra ventas con detalle por producto,
- controla stock por unidad,
- permite ventas fiadas con movimientos pendientes,
- aplica FIFO estricto en cobranzas,
- evita fraccionamiento,
- calcula saldo a favor,
- congela precioPagado en ventas al contado.
---

## 🔄 Flujo principal del sistema
1. El vendedor escanea productos.
2. Registra una venta (contado o fiado).
3. Si es fiado → se crean movimientos pendientes por producto.
4. El cliente entrega dinero.
5. El sistema liquida deuda FIFO, sin fraccionar ítems.
6. Si sobra dinero → saldo a favor.
7. Si falta → queda deuda pendiente.

## 🚀 Puesta en marcha

Requisitos: **Node 20+, npm, Postgres (Supabase).**
```bash
npm install
cp .env.example .env.local
npx prisma migrate dev --name init
npm run db:seed
npm run dev
```

Generar el `AUTH_SECRET`:

```bash
npx auth secret
```

> Usar **npm** en todo el equipo. Commit del `package-lock.json` obligatorio.

## 🧪 Comandos

| Comando | Para qué |
|---|---|
| `npm run dev` | Levantar en desarrollo |
| `npm run build` | Build de producción |
| `npm run lint` | Lint |
| `npm run typecheck` | Chequeo de tipos sin emitir |
| `npm test` | Tests |
| `npx prisma migrate dev` | Crear y aplicar una migración |
| `npx prisma studio` | Ver y editar los datos a mano |
| `npm run db:seed` | Cargar datos de ejemplo |

## 🏗 Arquitectura
El proyecto sigue la arquitectura enseñada en MDW 2026:

✔ Capa 1 — Validación de forma
Schemas de validación + errores 400.

✔ Capa 2 — Reglas de negocio
Funciones puras en `/lib/<dominio>/reglas.ts` + errores 409.

✔ Capa 3 — Acceso a datos
Prisma Client centralizado en `/lib/db/client.ts`.

✔ Autenticación y autorización (Clase 6)
- Auth.js (OAuth Google)
- Roles: `ADMIN`, `VENDEDOR`
- Matriz de permisos
- Función `verificarPermiso()`
- Función `requerirUsuario()`
- Pertenencia en ventas (`/api/ventas/mias`)


## 📁 Estructura del proyecto

```
app/
  (public)/             login
  (app)/                POS, productos, clientes, ventas
  api/                  Route Handlers (REST)
components/             UI
lib/
  db/                   Prisma Client
  producto/             validaciones + reglas de negocio
  cliente/              validaciones + reglas de negocio
  venta/                validaciones + reglas de negocio
  auth/                 sesión, roles, permisos
prisma/
  schema.prisma         modelo de datos
  seed.ts               datos de ejemplo
docs/
  api.md                documentación de API (Clase 4)
  reglas-negocio.md     validaciones + reglas (Clase 5)
  permisos.md           roles + matriz + pertenencia (Clase 6)
  spec.md               requerimientos funcionales
  adr/                  decisiones técnicas

```

## 🔐 Roles y permisos (Clase 6)
### ADMIN
- CRUD completo de productos
- CRUD completo de clientes
- CRUD completo de ventas
- Ve todas las ventas
- Opera cuenta corriente

### VENDEDOR
- Crea clientes
- Crea ventas
- Ve productos
- Ve clientes
- Ve solo sus ventas
- No edita productos
- No edita clientes
- No elimina recursos

## 📜 Reglas de negocio

### Productos
- Categoría debe existir
- Precio ≥ 0
- Stock ≥ 0
- Si permitestock = false → stock = 0
- Producto inactivo no puede usarse en ventas

### Clientes
- Documento único
- Teléfono válido
- Cliente inactivo no puede tener movimientos
- No se puede desactivar cliente con movimientos pendientes

### Ventas
- Debe tener al menos un detalle
- Cliente debe existir (si se envía)
- Producto debe existir y estar activo
- Subtotal coherente
- Total = suma de subtotales
- Stock suficiente
- Stock se descuenta al confirmar
- VENDEDOR solo crea ventas propias
- ADMIN puede crear ventas para cualquiera

### Cuenta Corriente
- FIFO estricto
- No fraccionar ítems
- Si no alcanza → saldoAFavor
- Si sobra → saldoAFavor

## 📘 Documentación API
La documentación completa está en:

```Código
docs/api.md
```
Incluye:
- endpoints
- roles
- request/response
- errores 400/401/403/404/409
- reglas de negocio por endpoint

## 📗 Documentación de reglas de negocio
```Código
docs/reglas-negocio.md
```
## 📕 Documentación de permisos
```Código
docs/permisos.md
```
## 📌 Definition of Done (DoD)
Una tarea está terminada cuando:
- [ ] Funciona en preview deployment
- [ ] Validación en servidor (no solo cliente)
- [ ] Estados de carga y error resueltos
- [ ] npm run build y npm run typecheck pasan
- [ ] Revisada por otro integrante del equipo