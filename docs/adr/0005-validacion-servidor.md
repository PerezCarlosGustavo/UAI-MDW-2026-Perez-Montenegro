# 📘 ADR 0005 — Validación en servidor (no en cliente)
**Estado:** Aprobado

**Fecha:** 2026-09-22

**Decide:** Equipo MDW — Carlos Gustavo Perez / Leandro Montenegro

## 🎯 Contexto
La cátedra exige:
- validación en servidor,
- errores 400/409 consistentes,
- funciones puras para reglas de negocio,
- evitar confiar en el cliente.

El frontend puede fallar, ser manipulado o enviar datos incompletos.
La duda técnica fue dónde validar:
- ¿solo en cliente?
- ¿solo en servidor?
- ¿en ambos?

## 🧩 Opciones consideradas
|Opción|A favor|En contra|
|------|-------|---------|
|A. Validar solo en cliente|Experiencia rápida|Inseguro, manipulable, no cumple cátedra|
|B. Validar solo en servidor|Seguro, consistente|El usuario recibe errores más tarde|
|C. Validar en cliente + servidor|Mejor UX + seguridad|Duplica lógica, más mantenimiento|


## ✅ Decisión
Elegimos **Opción C — Validar en cliente + servidor**, pero:
- la validación obligatoria es la del servidor,
- la del cliente es solo para mejorar la experiencia.

## 📌 Consecuencias
### ✔ Lo que se vuelve más fácil
- El servidor garantiza integridad de datos.
- Los errores 400/409 son consistentes.
- Las reglas de negocio viven en funciones puras.
- El frontend puede fallar sin comprometer la base de datos.

### ❗ Lo que se vuelve más difícil
- Hay que mantener dos capas de validación.
- El cliente debe reflejar los errores del servidor.

### 🔄 Qué habría que revisar si cambia el contexto
- Si se agrega una API pública, la validación del servidor debe endurecerse.
- Si se agrega mobile offline, habría que mover parte de la validación al cliente.