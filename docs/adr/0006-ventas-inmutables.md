# 📘 ADR 0006 — Inmutabilidad de ventas
**Estado:** Aprobado

**Fecha:** 2026-09-22

**Decide:** Equipo MDW — Carlos Gustavo Perez / Leandro Montenegro

## 🎯 Contexto
En el dominio del comercio:
- Las ventas no se editan una vez registradas.
- Si hay un error, se corrige con movimientos posteriores.
- Las ventas fiadas deben conservar precioPagado al momento de liquidación.
- Las ventas al contado deben conservar precioPagado al momento de cobro.

La duda técnica fue:
- ¿permitir editar ventas?
- ¿permitir anular ventas?
- ¿permitir reabrir ventas?

## 🧩 Opciones consideradas
|Opción|A favor|En contra|
|------|-------|---------|
|A. Permitir editar ventas|Flexible|Rompe contabilidad, rompe FIFO, rompe precioPagado|
|B. Permitir anular ventas|Corrige errores|Requiere auditoría, afecta stock, afecta cuenta corriente|
|C. Ventas inmutables|Simple, segura, contabilidad correcta|Requiere movimientos posteriores para corregir|


## ✅ Decisión
Elegimos **Opción C — Ventas inmutables**.

Porque **preserva integridad contable, respeta FIFO y evita inconsistencias en stock y cuenta corriente**.

## 📌 Consecuencias
### ✔ Lo que se vuelve más fácil
- FIFO funciona sin ambigüedades.
- precioPagado se congela correctamente.
- No hay que reabrir ventas ni recalcular totales.
- El historial del cliente es consistente.

### ❗ Lo que se vuelve más difícil
- Los errores deben corregirse con movimientos posteriores.
- El administrador debe tener herramientas para ajustar stock.

### 🔄 Qué habría que revisar si cambia el contexto
- Si se agrega facturación electrónica, podría requerirse anulación fiscal.
- Si se agrega auditoría avanzada, habría que registrar eventos de corrección.