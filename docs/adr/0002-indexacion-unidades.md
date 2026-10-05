# 📘 ADR 0002 — Indexación por unidades físicas en ventas fiadas
**Estado:** Aprobado

**Fecha:** 2026-09-22

**Decide:** Equipo MDW — Carlos Gustavo Perez / Leandro Montenegro

## 🎯 Contexto
El comercio pierde capital cuando:
- fía productos y congela el precio en pesos,
- registra deuda como “monto total” en lugar de “unidades físicas”,
- la inflación erosiona el valor de la deuda.

El sistema debe:
- registrar unidades de producto,
- recalcular el valor de la deuda al precio del día,
- aplicar FIFO sin fraccionar ítems,
- congelar precioPagado solo cuando se liquida un ítem.
La duda técnica fue cómo modelar la deuda:
- ¿guardar montos en pesos?
- ¿guardar unidades?
- ¿guardar ambos?

## 🧩 Opciones consideradas
|Opción|A favor|En contra|
|------|-------|---------|
|A. Guardar deuda en pesos|Simple|Pierde valor con inflación, no permite revalorización, rompe FIFO|
|B. Guardar unidades + precio del día|Revaloriza automáticamente|Requiere lógica compleja en cobranzas|
|C. Guardar unidades + precioPagado solo al liquidar|Modelo más fiel al dominio, soporta FIFO, soporta saldoAFavor|Requiere dos campos: unidades pendientes + precioPagado|


## ✅ Decisión
Elegimos **Opción C — Guardar unidades y calcular precioPagado solo al liquidar.**

Porque **preserva el valor del capital del comercio y permite aplicar FIFO sin fraccionar ítems.**

## 📌 Consecuencias
✔ Lo que se vuelve más fácil
- La deuda se revaloriza automáticamente con el precio del día.
- FIFO funciona sin fraccionar productos.
- El saldoAFavor se calcula correctamente.
- Las ventas fiadas no congelan precios en pesos.

❗ Lo que se vuelve más difícil
- La lógica de cobranza requiere algoritmo en el servidor.
- Hay que manejar casos donde el monto no alcanza para cubrir el ítem más antiguo.
- Hay que registrar precioPagado solo al liquidar, no antes.

🔄 Qué habría que revisar si cambia el contexto
- Si se agrega facturación electrónica, habría que registrar precioPagado en el comprobante fiscal.
- Si se permite fraccionar productos, FIFO debería adaptarse a unidades parciales.
