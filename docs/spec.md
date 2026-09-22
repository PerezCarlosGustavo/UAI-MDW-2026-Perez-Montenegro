# Especificación del sistema

> Este documento **es** el relevamiento de requerimientos del proyecto (eje metodológico, clase 2).
> Se completa en la clase 2 y se mantiene actualizado todo el cuatrimestre.
> Regla práctica: si una funcionalidad no está acá, no se implementa.

## 1. El problema

**Para quién:** Dueño y vendedores de un local comercial de barrio (almacén, kiosco y venta de bebidas).
**Qué hace hoy sin el sistema:** Registra ventas en un sistema de escritorio legacy desactualizado, gestionando las cuentas corrientes (fiados) congelando precios en pesos, lo que genera pérdidas de capital frente a la inflación.
**Qué mejora:** Centraliza el catálogo en la nube, agiliza el cobro en mostrador con escáner e indexa las cuentas corrientes por unidades de producto para preservar el valor del capital de trabajo del comercio.

## 2. Roles

| Rol | Quién es | Qué puede hacer que el otro no |
|---|---|---|
| Administrador | Propietario o encargado del comercio. | Gestionar el CRUD de productos y categorías, actualizar precios de lista, ajustar stock, administrar usuarios y consultar reportes/métricas globales. |
| Vendedor | Cajero u operador del punto de venta en mostrador. | Registrar ventas al contado o fiadas, procesar cobranzas/entregas de deuda de clientes y emitir/enviar comprobantes digitales. No puede modificar precios de lista ni ver métricas administrativas. |

## 3. Entidades

Los sustantivos que aparecen en las historias de usuario. De acá sale el modelo de datos.

| Entidad | Qué representa | Se relaciona con |
|---|---|---|
| **Categoria** | Clasificación de rubros del comercio (Bebidas, Kiosco, Limpieza, etc.). | **1-N** con `Producto`. |
| **Producto** | Artículos comercializados en el almacén con su precio de lista, código de barras, indicador de si controla stock (`permiteStock: boolean`) y stock actual. | **N-1** con `Categoria`, **N-M** con `Venta` (vía `DetalleVenta`), **1-N** con `CuentaCorrienteItem`. |
| **Cliente** | Clientes registrados para la gestión de Cuenta Corriente y saldos a favor. | **1-N** con `Venta`, **1-N** con `CuentaCorrienteItem`. |
| **Venta** | Cabecera de la transacción realizada en caja (al contado o fiada). | **N-1** con `Cliente` (opcional), **N-1** con `Usuario`, **1-N** con `DetalleVenta`. |
| **DetalleVenta** | Línea del ticket que resuelve la relación N-M entre Venta y Producto para ventas liquidadas. | **N-1** con `Venta`, **N-1** con `Producto`. |
| **CuentaCorrienteItem** | Registro granular de unidades físicas fiadas pendientes de revalorización y cobro. | **N-1** con `Cliente`, **N-1** con `Producto`. |

## 4. Historias de usuario

Formato: **Como** <rol>, **quiero** <acción>, **para** <beneficio>.
Cada historia lleva su criterio de aceptación: cómo se verifica que está terminada.

### H1 — Autenticación y control de acceso
**Como** *usuario*, **quiero** iniciar sesión con correo y contraseña, **para** acceder a las funcionalidades de mi rol.

Criterios de aceptación:
- [ ] Dado un usuario registrado con credenciales válidas, cuando ingresa email y contraseña correctos, entonces el sistema inicia sesión y redirige al Dashboard/POS según su rol.
- [ ] Caso de error: cuando se ingresan credenciales inválidas o se intenta ingresar a una ruta protegida sin sesión, el sistema muestra un mensaje de error claro o redirige al login denegando el acceso en el servidor.

#### H2 — CRUD de Productos y Alerta de Stock
**Como** *administrador*, **quiero** registrar, editar y actualizar productos indicando si gestionan stock o no, **para** mantener el catálogo ordenado y controlar el inventario de los artículos empaquetados.

Criterios de aceptación:
- [ ] Dado que el administrador completa los datos de un producto, cuando activa o desactiva la casilla "Gestiona Stock", el sistema habilita o deshabilita los campos de `stockActual` y `stockMinimo`.
- [ ] Caso de error / Alerta: cuando el stock de un producto que gestiona stock (`permiteStock = true`) cae por debajo de su `stockMinimo`, el sistema lo resalta en el catálogo con un indicador visual de alerta.

#### H3 — Venta al Contado en POS (Atajos + Lector + Stock Negativo)
**Como** *vendedor*, **quiero** escanear o buscar productos ágilmente y cobrar al contado en el POS, **para** atender rápido en el mostrador independientemente de si el producto descuenta stock o no.

Criterios de aceptación:
- [ ] Dado que el vendedor cobra una venta, el sistema descuenta unidades únicamente para aquellos productos que tengan `permiteStock = true`. Para los productos pesables o sin control (`permiteStock = false`), omite el descuento de inventario.
- [ ] Manejo de stock insuficiente: si un producto con `permiteStock = true` se vende con stock insuficiente o en cero, el sistema muestra una advertencia visual pero **permite completar la venta**, dejando el saldo en negativo para no frenar la atención en caja.

### H4 — Imputación de Fiado a Cuenta Corriente
**Como** *vendedor*, **quiero** imputar una compra fiada a la Cuenta Corriente de un cliente guardando las unidades de producto, **para** no congelar el precio en pesos frente a la inflación.

Criterios de aceptación:
- [ ] Dado que se selecciona la forma de pago "Cuenta Corriente" y un cliente válido, cuando se confirma la venta, el sistema registra cada producto como CuentaCorrienteItem con estado PENDIENTE y sus unidades correspondientes.
- [ ] Caso de error: cuando se intenta procesar una venta en cuenta corriente sin seleccionar un cliente registrado, el sistema bloquea la acción y exige seleccionar o crear un cliente.

### H5 — Cobranza de Deuda por Monto (FIFO sin Fraccionar)
**Como** *vendedor*, **quiero** ingresar un monto entregado por el cliente para saldar deuda, **para** que el sistema cancele los productos fiados en orden cronológico a precio de hoy y acredite el sobrante.

Criterios de aceptación:
- [ ] Dado que el cliente entrega dinero en efectivo, cuando el vendedor registra el cobro, el sistema cotiza los ítems pendientes al precio del día, salda al 100% los productos que alcance a cubrir el dinero (FIFO), guarda su precioPagado y acredita cualquier sobrante como saldoAFavor en la ficha del cliente.
- [ ] Caso de error: cuando el dinero entregado no alcanza para cubrir la totalidad del producto más antiguo de la lista, el sistema no fracciona el producto, no lo marca como pagado y acumula todo el dinero como saldoAFavor.

### H6 — Generación y Envío de Comprobante Digital
**Como** *vendedor*, **quiero** emitir el ticket PDF de compra y enviarlo por email al cliente, **para** entregar constancia de la operación realizada.

Criterios de aceptación:
- [ ] Dado que se finaliza un cobro o liquidación de deuda, cuando el vendedor confirma el comprobante, el sistema genera el PDF formato térmico 58mm y envía automáticamente el correo mediante la API de Resend.
- [ ] Caso de error: cuando falla el servicio de correo externo (API Resend), el sistema notifica el fallo sin revertir la transacción de la venta y permite descargar el PDF localmente.


## 5. Flujo principal

El recorrido completo, paso a paso, del flujo que da valor al sistema (no un ABM).

1. El Vendedor inicia sesión en la aplicación y accede directamente a la interfaz del Punto de Venta (POS).
2. Agrega artículos al carrito escaneando los códigos de barras con la pistola USB o buscando por nombre/código con el teclado.
3. Presiona el atajo de teclado para seleccionar el tipo de venta (Al Contado o Cuenta Corriente).
4. Si es en Cuenta Corriente, selecciona el Cliente y confirma la transacción; las unidades físicas se registran como deuda en CuentaCorrienteItem y se descuenta el stock.
5. Días después, el cliente regresa al comercio a entregar dinero para saldar su cuenta.
6. El Vendedor abre la ficha del cliente en el módulo de Cuentas Corrientes e ingresa el monto entregado en efectivo.
7. El sistema ejecuta el algoritmo en el servidor: revaloriza los productos fiados al precio del día de hoy, cancela de forma cronológica (FIFO) los ítems cubiertos al 100% y guarda cualquier resto como saldoAFavor.
8. El sistema genera el comprobante de liquidación en PDF (formato térmico 58mm) y dispara el correo electrónico automático al cliente.

## 6. Reglas de negocio

Las restricciones que **no** son obvias y que la IA no puede adivinar. Estas son las que hay que revisar a mano.

- **Indexación por unidades físicas:** Al fiar una compra, el valor adeudado no se congela en pesos; se guardan las unidades de los productos y la deuda total en pesos se calcula dinámicamente multiplicando las unidades pendientes por el precio actualizado en el catálogo.
- **Cancelación FIFO sin fraccionar:** El cobro por monto entregado salda los ítems pendientes desde el más antiguo al más reciente. Un producto solo se marca como PAGADO si el pozo disponible cubre el 100% de su valor al precio de hoy. No se saldan fracciones de producto.
- **Acreditación de saldo a favor:** Cualquier sobrante en pesos resultante de un pago que no alcance para cubrir un producto entero, se registra en el campo saldoAFavor del cliente y se utiliza automáticamente como crédito en la siguiente liquidación.
- **Inmutabilidad de ventas al contado o saldadas:** El precio unitario de las ventas al contado o de los productos fiados ya saldados (precioPagado) se congela permanentemente al momento exacto de la transacción de cobro.
- **Control selectivo de stock (`permiteStock`):** El inventario solo se descuenta para productos que tengan habilitado el indicador `permiteStock = true` (artículos envasados o empaquetados). Los productos fraccionados o pesables (panadería, fiambre) no descuentan stock ni generan alertas de inventario.
- **Permisividad de stock (Stock Negativo):** La falta de stock registrado en productos con `permiteStock = true` no bloquea la caja. La venta se procesa normalmente dejando el stock en saldo negativo para no paralizar la atención al cliente, requiriendo un ajuste posterior por el administrador.


## 7. Requisitos no funcionales --MEELS

### Mantenibilidad
- El backend debe tener funciones puras para reglas de negocio y validaciones.
- El acceso a datos debe centralizarse en un único cliente Prisma.
- Las rutas deben seguir la estructura del App Router sin lógica duplicada.

### Escalabilidad
- El sistema debe soportar 10 vendedores operando en simultáneo sin degradación perceptible.
- Las consultas de ventas deben paginarse para evitar cargas masivas.

### Eficiencia
- La carga del POS debe ser menor a 1 segundo en condiciones normales.
- Las búsquedas de productos deben resolverse en menos de 150 ms.

### Logging
- Todas las ventas y cobranzas deben registrar timestamp y usuario.
- Los errores deben registrarse en consola del servidor y en Vercel Logs.

### Seguridad
- Las rutas deben requerir sesión y rol válido.
- Los datos sensibles (tokens, secrets) deben estar en variables de entorno.
- No se debe exponer información de otros usuarios (pertenencia).

### Usabilidad

Los cinco criterios del material de la clase 2, convertidos en algo **medible**. Reemplacen los
ejemplos por los de su dominio: lo que importa es que se pueda verificar, no que suene bien.

- **Eficiencia:** La carga y cobro de una venta al contado de 3 productos se realiza en 4 interacciones o menos (3 escaneos + 1 tecla de cobro F2).
- **Errores:** Si falta un campo obligatorio al dar de alta un producto o cliente, el sistema resalta el campo con error mediante la validación de Zod y no borra los datos ya completados en el formulario.
- **Aprendizaje:** Un vendedor nuevo puede buscar un producto, agregarlo al carrito y realizar una venta al contado en menos de 2 minutos sin requerir explicación.
- **Recuerdo:** La pantalla del Punto de Venta (POS) está a un solo clic desde el menú lateral y siempre accesible mediante el botón principal del header.
- **Satisfacción:** Se prueba la interfaz con el dueño de un comercio de barrio antes del Demo Day obteniendo la validación operativa.

### Accesibilidad

Esta lista es **igual para todos los proyectos**: no hay que adaptarla, hay que cumplirla.

- Navegación completa por teclado con foco visible.
- Labels asociados a todos los inputs.
- Texto alternativo en imágenes informativas.
- Contraste mínimo 4.5:1.
- Errores comunicados con texto, no solo color.

## 8. Integración externa

**Cuál:** API de envío de correo electrónico (Resend) y librería de generación de PDF (@react-pdf/renderer).
**Para qué:** Enviar automáticamente el comprobante digital de compra o resumen de liquidación de deuda al email del cliente.
**Qué pasa si se cae:** Si la API externa de correo falla o no hay conexión a internet, el sistema captura la excepción, registra la venta con normalidad en PostgreSQL y permite visualizar o descargar el comprobante PDF localmente desde la pantalla del POS.

## 9. Fuera de alcance

Lo que decidimos **no** hacer, para no volver a discutirlo en la clase 12.

- Facturación electrónica directa con AFIP / ARCA (WSFE).
- Control de depósitos remotos o gestión multi-sucursal.
- Integración por hardware/puerto serie con balanzas electrónicas (los productos pesables/fraccionados no descuentan stock y se cargan definiendo la unidad o monto en el POS).
- Módulo de compras automatizadas o pedidos automáticos a proveedores.
- Programas de puntos, cupones o fidelización de clientes.

## 10. Supuestos del sistema
- Los precios de lista se actualizan manualmente por el administrador.
- Los productos pesables o fraccionados no descuentan stock.
- El cliente puede tener saldo a favor ilimitado.
- El vendedor no puede editar ventas ya registradas.
- Las ventas no se anulan; se corrigen con movimientos posteriores.
- El sistema no maneja múltiples sucursales ni depósitos.
- El POS siempre funciona con conexión a internet (no hay modo offline).
- El precioPagado de ventas al contado es inmutable.
- El monto entregado en cobranza siempre es en pesos argentinos.

## 11. Glosario
- POS: Punto de Venta.
- CuentaCorrienteItem: Unidad física fiada pendiente de pago.
- SaldoAFavor: Crédito en pesos disponible para el cliente.
- FIFO: First In, First Out (orden cronológico).
- PrecioPagado: Precio final congelado al momento de liquidar un ítem fiado.
- PermiteStock: Indicador booleano que determina si un producto descuenta stock.
- StockNegativo: Situación permitida donde el inventario queda por debajo de cero.
- Venta Fiada: Venta cuyo pago se difiere y se registra en cuenta corriente.
