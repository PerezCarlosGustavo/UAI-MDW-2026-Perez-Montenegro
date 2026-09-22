# 📘 ADR 0004 — Stock negativo permitido
**Estado:** Aprobado

**Fecha:** 2026-09-22

**Decide:** Equipo MDW — Carlos Gustavo Perez / Leandro Montenegro

## 🎯 Contexto
En el dominio del comercio de barrio, la atención en caja no puede detenerse por falta de stock registrado.
Ejemplos reales:
- Se vendió un pack pero el administrador no ajustó stock.
- Se recibió mercadería pero aún no se cargó en el sistema.
- El vendedor necesita cobrar rápido y no puede esperar correcciones.

La cátedra además exige explícitamente:
- permitir stock negativo,
- mostrar advertencias,
- no bloquear la venta.

La duda técnica fue cómo manejar stock insuficiente sin romper el flujo del POS.

## 🧩 Opciones consideradas
|Opción|A favor|En contra|
|------|-------|---------|
|A. Bloquear la venta si stock < cantidad|Evita inconsistencias|Frena la caja, rompe el dominio, no cumple la cátedra|
|B. Permitir la venta pero no descontar stock|Caja fluida|Stock deja de representar inventario real|
|C. Permitir la venta y descontar stock, incluso si queda negativo|Caja fluida, modelo realista, cumple cátedra|Requiere ajuste posterior por administrador|


## ✅ Decisión
Elegimos **Opción C — Permitir stock negativo.**

Porque **mantiene la fluidez del POS**, respeta el dominio real del comercio y cumple con los criterios de aceptación de la cátedra.

## 📌 Consecuencias
### ✔ Lo que se vuelve más fácil
- El POS nunca se bloquea por falta de stock.
- El vendedor puede atender rápido sin depender del administrador.
- Las ventas reflejan la realidad operativa del comercio.
- El ajuste de stock se hace después, no durante la venta.

### ❗ Lo que se vuelve más difícil
- El administrador debe revisar productos con stock negativo.
- Las alertas deben ser claras pero no bloqueantes.
- Las reglas de negocio deben permitir stock < 0 sin error 409.

### 🔄 Qué habría que revisar si cambia el contexto
- Si se agrega multi-depósito, el stock negativo debería ser por depósito.
- Si se agrega auditoría automática, habría que registrar eventos de stock negativo.