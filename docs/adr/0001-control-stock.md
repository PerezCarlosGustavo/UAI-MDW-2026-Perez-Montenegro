# 📘 ADR 0001 — Control de stock mediante permiteStock
**Estado:** Aprobado

**Fecha:** 2026-09-22

**Decide:** Equipo MDW — Carlos Gustavo Perez / Leandro Montenegro

## 🎯 Contexto
En el dominio del comercio de barrio, existen **dos tipos de productos:**
1. Productos empaquetados (bebidas, limpieza, kiosco)
    - Se controlan por unidad.
    - Tienen stock físico real.

2. Productos pesables o fraccionados (pan, fiambre, verdulería)
    - No se controlan por unidad.
    - El stock no es relevante para el POS.
    - El precio depende del peso o del monto ingresado.

El sistema debe permitir:
- descontar stock solo para productos empaquetados,
- permitir ventas con stock negativo para no frenar la caja,
- evitar alertas o descuentos en productos pesables.

La duda técnica fue cómo modelar esta diferencia sin duplicar entidades ni agregar complejidad innecesaria.

## 🧩 Opciones consideradas
|Opción|A favor|En contra|
|------|-------|---------|
A. Dos entidades distintas: ProductoEmpaquetado y ProductoPesable|Modelo explícito, sin ambigüedad|Duplica lógica, complica CRUD, rompe POS, aumenta complejidad en ventas
B. Campo `tipoProducto` con enum (`empaquetado`, `pesable`)|Simple de entender|Requiere condicionales en todas las reglas, no evita errores de stock
C. Campo booleano `permiteStock`|Simple, claro, usado en la industria, evita duplicación, fácil de validar|Requiere reglas adicionales para stock negativo y alertas


## ✅ Decisión
Elegimos **Opción C — Campo booleano `permiteStock`.**

Porque es la forma más simple y robusta de controlar inventario sin duplicar entidades ni complejizar el POS.

### 📌 Consecuencias
✔ Lo que se vuelve más fácil
- El POS puede decidir en una línea si descuenta stock o no.
- Las reglas de negocio son simples:
  - si `permiteStock = true` → descuenta
  - si `permiteStock = false` → no descuenta
- El CRUD de productos sigue siendo uno solo.
- Las alertas de stock mínimo solo aplican a productos empaquetados.
- Las ventas no se bloquean por stock insuficiente (stock negativo permitido).

❗ Lo que se vuelve más difícil
- Hay que validar que si permiteStock = false, entonces stockActual = 0.
- El administrador debe ajustar stock manualmente cuando queda negativo.
- El POS debe mostrar advertencias sin bloquear la venta.

🔄 Qué habría que revisar si cambia el contexto
- Si el comercio incorpora balanzas electrónicas o productos con peso automático, habría que evaluar un tipo de producto con unidad variable.
- Si se agrega multi-sucursal, el stock debería ser por depósito, no por producto.